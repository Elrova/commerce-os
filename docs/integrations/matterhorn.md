# Intégration Matterhorn

Audit réalisé le 30 juillet 2026 à partir de la [documentation publique Matterhorn](https://lingeriematterhorn.fr/?str=api-help) et de sa référence SwaggerHub 1.0.4.1. Aucun appel authentifié n’a été effectué pendant l’implémentation.

## Fonctionnalités vérifiées

- Base utilisée par les exemples officiels : `https://matterhorn-wholesale.com/B2BAPI`.
- Authentification : clé brute dans l’en-tête HTTP `Authorization`.
- Catalogue : `GET /ITEMS/?page=1`.
- Pagination : paramètre `page`, 100 produits par défaut.
- Taille de page : paramètre `limit`, maximum documenté de 1000.
- Détail : `GET /ITEMS/{product_id}`.
- Catégories : `GET /DICTIONARIES/CATEGORIES`.
- Marques : `GET /DICTIONARIES/BRANDS`.
- Filtres catalogue : `brand_id`, `category_id`, `new_collection=1`.
- Synchronisation incrémentale : `last_update=YYYY-MM-DD HH:MM` filtre les changements de prix ou stock.
- Livraison : `GET /DICTIONARIES/DELIVERY` et `GET /DICTIONARIES/DELIVERY/{country_code}` exposent les méthodes et coûts.
- Commandes documentées : `PUT /ACCOUNT/ORDERS/`.
- Détail et statut d’une commande : `GET /ACCOUNT/ORDERS/{order_id}`.
- Produit JSON documenté : `id`, `active`, noms, description, couleur, catégorie, marque, stock total, URL, images, variantes, prix multidevises et tables de tailles.
- Variante documentée : `variant_uid`, nom, stock, temps maximal de traitement et EAN.
- L’identifiant produit et `variant_uid` doivent être conservés.
- Société et adresse publiées : Grupa Modne Zakupy Sp. z o.o., Koszalin, Pologne.

## Implémentation de ce sprint

Seuls `ITEMS`, `ITEMS/{id}` et `DICTIONARIES/CATEGORIES` sont appelés. Le prix EUR, les stocks et variantes sont normalisés. Le stock agrégé est la somme des stocks des variantes lorsqu’elles existent.

Le curseur ELROVA encapsule la page Matterhorn et le nombre déjà importé. `MATTERHORN_SYNC_MAX_PRODUCTS`, fixé à 100 par défaut, bloque la première synchronisation au niveau du connecteur.

## Fonctionnalités supposées ou choix conservateurs

- `prices.EUR` est traité comme prix d’achat HT : l’exemple de commande associe le même montant au champ `netprice`, mais la définition du champ catalogue n’emploie pas explicitement « HT ».
- Le MOQ normalisé vaut 1, aucun MOQ produit n’étant exposé dans l’exemple ou les paramètres documentés. Cette valeur doit être confirmée contractuellement.
- La marque est également utilisée comme fabricant faute de champ fabricant distinct.
- La recherche textuelle n’est pas documentée côté API : ELROVA filtre localement la page récupérée.

## Non disponibles ou volontairement désactivées

- Création de commande : documentée mais non implémentée et capacité forcée à `false`.
- Annulation de commande : non documentée dans la page publique.
- Tracking dédié : aucun endpoint de tracking documenté ; seul le détail de commande peut contenir numéro et URL.
- Retours, webhooks, colis neutre et autorisation marketplace : non documentés.
- Estimation de livraison : endpoint documenté, mais schéma public de réponse non vérifié ; non implémentée.
- Prix conseillé, poids, dimensions, pays livrables par produit, pays exact d’entrepôt, délais de livraison et coût par produit : non exposés dans l’exemple produit, donc laissés à `null` ou vides.
- Codes et corps d’erreurs propres à Matterhorn : non détaillés. ELROVA traduit prudemment les statuts HTTP usuels.
- Limites de débit : non publiées.

## Questions ouvertes

1. Confirmer que `prices.EUR` est toujours net de TVA.
2. Confirmer l’absence de MOQ et les règles du dropshipping à l’unité.
3. Obtenir le schéma exact des dictionnaires catégories et livraison.
4. Confirmer pays d’expédition, délais, colis neutre et marketplaces autorisées.
5. Obtenir les limites de débit et recommandations de retry.
6. Vérifier si le User-Agent personnalisé est officiellement accepté.
7. Clarifier les statuts et formats d’erreur.

## Sécurité et activation

La clé existe uniquement dans `MATTERHORN_API_KEY`. Supabase conserve seulement `env:MATTERHORN_API_KEY`. `.env.local` est ignoré par Git.

```powershell
$env:MATTERHORN_API_KEY="votre-cle-locale"
$env:MATTERHORN_SYNC_MAX_PRODUCTS="100"
npm.cmd run dev
```

Dans Supplier Intelligence, sélectionner **Activer Matterhorn**, puis **Tester** et **Synchroniser**. Le catalogue importé est visible sur la page de l’intégration.

Test manuel volontaire, jamais exécuté automatiquement :

```powershell
npm.cmd run test:matterhorn:connection
```
