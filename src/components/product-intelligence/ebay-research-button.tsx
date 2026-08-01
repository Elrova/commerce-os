"use client";
import { useState } from "react";
export function EbayResearchButton() { const [submitting,setSubmitting]=useState(false); return <button type="submit" onClick={()=>setSubmitting(true)} disabled={submitting} className="h-11 rounded-xl bg-[#20211d] px-5 text-sm font-medium text-white disabled:opacity-60">{submitting?"Analyse eBay en cours…":"Analyser sur eBay"}</button>; }
