# eBay Marketplace Account Deletion

## Endpoint

L'endpoint public est disponible en `GET` et `POST` à l'URL HTTPS exacte configurée dans eBay :

`https://www.elrova.fr/api/ebay/account-deletion`

La valeur de `EBAY_ACCOUNT_DELETION_ENDPOINT` doit être strictement identique à celle enregistrée dans le portail eBay, protocole, domaine et chemin compris, sans ajouter de slash final.

## Configuration serveur

- `EBAY_ACCOUNT_DELETION_ENDPOINT` : URL publique exacte.
- `EBAY_ACCOUNT_DELETION_VERIFICATION_TOKEN` : token eBay de 32 à 80 caractères, limité aux caractères alphanumériques, `_` et `-`.

Ces valeurs sont exclusivement serveur. Le token ne doit jamais être préfixé par `NEXT_PUBLIC_`, envoyé au navigateur, journalisé ou persisté dans Supabase.

## Challenge GET

Le challenge calcule SHA-256 dans l'ordre exact : `challengeCode + verificationToken + endpoint`. La réponse est un objet JSON `challengeResponse` avec un hash hexadécimal.

## Notifications POST et données

Le payload est validé avec Zod et immédiatement acquitté en `204` après réservation idempotente. Supabase ne conserve qu'un hash SHA-256 du `notificationId`, le topic et un statut technique. Aucun payload brut, `userId`, `username` ou `eiasToken` n'est persisté.

La fonction métier est actuellement explicitement limitée au statut `acknowledged-not-linked` : aucune table ELROVA n'est encore reliée à un utilisateur eBay et aucune suppression n'est prétendue.

## Signature — étape obligatoire avant traitement réel

`X-EBAY-SIGNATURE` n'est pas encore vérifiée. Un point d'extension séparé est préparé dans `verifyEbayNotificationSignature`. Avant d'exploiter ce webhook à grande échelle ou de supprimer/anonymiser effectivement des données, implémenter la validation ECC à partir de la clé publique fournie par la Notification API eBay, avec cache de clé.

Le challenge GET ne doit pas être soumis à cette vérification.

## Portail eBay

1. Déployer l'application et appliquer la migration Supabase.
2. Ajouter les deux variables dans les environnements Production de Vercel, puis redéployer.
3. Dans eBay Developer Portal, ouvrir les notifications du keyset Production.
4. Choisir Marketplace Account Deletion et saisir l'adresse email d'alerte.
5. Saisir exactement l'URL de l'endpoint et le même verification token que dans Vercel.
6. Enregistrer : eBay lance immédiatement le challenge GET.
7. Après validation, utiliser « Send Test Notification » et vérifier une réponse `204` ainsi que le journal technique sans donnée personnelle.
