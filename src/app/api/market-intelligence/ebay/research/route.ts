import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth/current-context";
import { createClient } from "@/lib/supabase/server";
import { EbayAuthenticationError, EbayConfigurationError, EbayMarketplaceService, createEbaySearchPlan, getEbayEnvironment } from "@/lib/market-intelligence/ebay";
function redirect(request: Request, path: string, key: "success"|"error", value: string) { const url = new URL(path,request.url); url.searchParams.set(key,value); return NextResponse.redirect(url,303); }
export async function POST(request: Request) {
  const context = await getCurrentContext();
  const form = await request.formData();
  const integrationId = String(form.get("integrationId") ?? ""), productId = String(form.get("productId") ?? "");
  const returnPath = `/app/intelligence/fournisseurs/${integrationId}/produits/${productId}/analyse`;
  const supabase = await createClient();
  const [{ data: integration }, { data: product }] = await Promise.all([
    supabase.from("supplier_integrations").select("id").eq("id",integrationId).eq("workspace_id",context.workspace.id).maybeSingle(),
    supabase.from("supplier_catalog_products").select("id,title,sku,ean,gtin,brand,category").eq("id",productId).eq("integration_id",integrationId).eq("workspace_id",context.workspace.id).maybeSingle(),
  ]);
  if (!integration || !product) return redirect(request,"/app/intelligence/fournisseurs","error","integration-not-found");
  const plan=createEbaySearchPlan(product), environment=getEbayEnvironment();
  const { data: cached } = await supabase.from("marketplace_research_runs").select("id").eq("workspace_id",context.workspace.id).eq("supplier_catalog_product_id",productId).eq("marketplace","ebay").eq("environment",environment).eq("query",plan.query).eq("status","completed").gt("expires_at",new Date().toISOString()).order("created_at",{ascending:false}).limit(1).maybeSingle();
  if (cached) return redirect(request,returnPath,"success","ebay-cache");
  if (!process.env.EBAY_CLIENT_ID || !process.env.EBAY_CLIENT_SECRET) return redirect(request,returnPath,"error","ebay-not-configured");
  const expiresAt=new Date(Date.now()+30*60_000).toISOString();
  const { data: run, error: runError } = await supabase.from("marketplace_research_runs").insert({workspace_id:context.workspace.id,supplier_catalog_product_id:productId,marketplace:"ebay",environment,query:plan.query,search_strategy:plan.strategy,status:"running",expires_at:expiresAt}).select("id").single();
  if (runError || !run) return redirect(request,returnPath,"error","ebay-research-failed");
  try {
    const result=await new EbayMarketplaceService().research(product);
    if (result.matches.length) { const { error }=await supabase.from("marketplace_listing_snapshots").insert(result.matches.map((match)=>({workspace_id:context.workspace.id,research_run_id:run.id,supplier_catalog_product_id:productId,marketplace:"ebay",environment,external_id:match.listing.externalId,normalized_listing:match.listing,match_score:match.matchScore,match_level:match.level,reasons:match.reasons,warnings:match.warnings,retrieved_at:match.listing.retrievedAt}))); if(error) throw error; }
    await supabase.from("marketplace_research_runs").update({status:"completed",normalized_results:result.matches.map((match)=>({externalId:match.listing.externalId,matchScore:match.matchScore,level:match.level})),metrics:result.metrics,finished_at:new Date().toISOString()}).eq("id",run.id).eq("workspace_id",context.workspace.id);
    return redirect(request,returnPath,"success","ebay-researched");
  } catch(error) {
    const accessPending=error instanceof EbayAuthenticationError;
    await supabase.from("marketplace_research_runs").update({status:accessPending?"access_pending":"failed",error_code:accessPending?"access-pending":"research-failed",finished_at:new Date().toISOString()}).eq("id",run.id).eq("workspace_id",context.workspace.id);
    return redirect(request,returnPath,"error",error instanceof EbayConfigurationError?"ebay-not-configured":accessPending?"ebay-access-pending":"ebay-research-failed");
  }
}
