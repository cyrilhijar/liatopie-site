const WP_GRAPHQL = 'https://tygqbjh.cluster100.hosting.ovh.net/graphql';

async function gql(query: string) {
  const res = await fetch(WP_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

/**
 * Page d'accueil — champs ACF (groupe "Page d'accueil", graphql_field_name: "pageAccueil")
 * Retourne null si le groupe n'est pas encore exposé en GraphQL.
 */
export async function getHomePage() {
  try {
    const data = await gql(`{
      page(id: "6", idType: DATABASE_ID) {
        pageAccueil {
          heroTitle
          heroSubtitle
          heroCtaPrimary
          heroCtaSecondary
          pourquoiTitle
          pourquoiIntro
          pourQuiTitre
          pourQuiCorps1
          pourQuiStatTexte
          pourQuiEncartQuote
          contactTitre
          contactSousTitre
        }
      }
    }`);
    return data?.page?.pageAccueil ?? null;
  } catch {
    return null;
  }
}

/**
 * Articles de blog
 */
export async function getPosts(first = 10) {
  const data = await gql(`{
    posts(first: ${first}) {
      nodes {
        databaseId
        slug
        title
        date
        excerpt
        featuredImage { node { sourceUrl altText } }
      }
    }
  }`);
  return data?.posts?.nodes ?? [];
}

/**
 * Etudes de cas
 */
export async function getEtudesDeCas(first = 10) {
  const data = await gql(`{
    etudesDeCas(first: ${first}) {
      nodes {
        databaseId
        slug
        title
        date
        excerpt
        featuredImage { node { sourceUrl altText } }
      }
    }
  }`);
  return data?.etudesDeCas?.nodes ?? [];
}

/**
 * Ressources
 */
export async function getRessources(first = 10) {
  const data = await gql(`{
    ressources(first: ${first}) {
      nodes {
        databaseId
        slug
        title
        date
        excerpt
        featuredImage { node { sourceUrl altText } }
      }
    }
  }`);
  return data?.ressources?.nodes ?? [];
}
