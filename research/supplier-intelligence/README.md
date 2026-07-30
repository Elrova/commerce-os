# Supplier Intelligence

La couche fournisseur est isolée derrière `SupplierConnector`. Les réponses externes sont validées par Zod et converties en `NormalizedSupplierProduct` avant toute écriture.

Le registre distingue les environnements `mock`, `sandbox`, `production` et `disabled`. Le service de synchronisation prend en charge pagination, concurrence limitée, retry exponentiel, upsert idempotent, erreurs par produit, dry-run et rapport de reprise.

Le connecteur `mock-eu` contient exclusivement des fixtures locales. Il ne nécessite aucun secret et ne représente aucune société réelle.

## Ajouter un connecteur

1. Documenter et valider contractuellement l’API.
2. Implémenter uniquement les capacités réellement disponibles.
3. Valider chaque réponse avec les schémas normalisés.
4. Utiliser une référence de secret ; ne jamais stocker la valeur en base.
5. Tester en sandbox, notamment idempotence, limites, prix et commandes.
