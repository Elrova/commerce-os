# Configurer Supabase pour ELROVA Commerce OS

## 1. Créer le projet

1. Créez un projet depuis le tableau de bord Supabase.
2. Choisissez une région proche de vos utilisateurs.
3. Conservez le mot de passe de base de données dans un gestionnaire de secrets.

Commerce OS n’utilise jamais la clé `service_role` dans le navigateur. La V1
utilise uniquement la clé publique anon avec les politiques RLS de la base.

## 2. Configurer l’environnement local

Dans **Project Settings → API**, récupérez :

- l’URL du projet ;
- la clé publique `anon`.

Créez ensuite votre fichier local :

```powershell
Copy-Item .env.example .env.local
```

Renseignez les deux valeurs dans `.env.local` :

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
```

`.env.local` est ignoré par Git. Ne placez jamais de clé `service_role` dans une
variable commençant par `NEXT_PUBLIC_`.

## 3. Appliquer les migrations

La migration initiale se trouve dans `supabase/migrations`. Elle crée le modèle
V1, les index, les politiques RLS, les canaux initiaux et le trigger
d’onboarding.

Avec la CLI Supabase :

```powershell
npx supabase login
npx supabase link --project-ref VOTRE_PROJECT_REF
npx supabase db push
```

Pour un premier essai sans CLI, le contenu de la migration peut aussi être
exécuté dans **SQL Editor**. La CLI reste préférable afin de conserver un
historique reproductible.

## 4. Configurer l’inscription

Dans **Authentication → URL Configuration**, configurez l’URL du site local :

```text
http://localhost:3000
```

Deux modes sont possibles :

- confirmation e-mail désactivée : l’inscription ouvre immédiatement une
  session et redirige vers `/app` ;
- confirmation e-mail activée : l’utilisateur reçoit un message de
  confirmation, puis se connecte depuis `/connexion`.

Dans les deux cas, le trigger `handle_new_user` crée atomiquement :

- le profil ;
- un workspace `ELROVA Store` ;
- l’adhésion de l’utilisateur avec le rôle `owner`.

Cette logique est transactionnelle : si l’onboarding échoue, la création de
l’utilisateur échoue aussi, ce qui évite un compte incomplet.

## 5. Tester le parcours

```powershell
npm.cmd run dev
```

Puis :

1. ouvrez `http://localhost:3000/inscription` ;
2. créez un compte avec un mot de passe d’au moins 8 caractères ;
3. confirmez l’adresse si la confirmation e-mail est active ;
4. connectez-vous sur `http://localhost:3000/connexion` ;
5. vérifiez la redirection vers `/app` ;
6. vérifiez dans Supabase les lignes de `profiles`, `workspaces` et
   `workspace_members` ;
7. ouvrez `/app` dans une fenêtre privée et vérifiez la redirection vers
   `/connexion` ;
8. testez « Se déconnecter » dans la navigation.

## 6. Vérifier le projet

```powershell
npm.cmd run lint
npm.cmd run build
```

Le dashboard affiche temporairement des indicateurs de démonstration tant que
les tables `orders`, `products` et `opportunities` du workspace sont vides. Ce
fallback est isolé dans `src/lib/dashboard-data.ts`.
