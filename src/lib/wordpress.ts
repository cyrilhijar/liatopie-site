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

export async function getHomePage() {
  try {
    const data = await gql(`{
      page(id: "6", idType: DATABASE_ID) {
        pageAccueil {
          hero { title subtitle ctaPrimary ctaSecondary }
          pourquoi { title intro }
          pourQui {
            titre corps1 corps2 corps2Source
            statTexte statSource
            encartQuote encartSource encartCta
          }
          contact { titre sousTitre item1 item2 opcoInfo }
        }
      }
    }`);
    return data?.page?.pageAccueil ?? null;
  } catch (e) {
    console.error("[WP] getHomePage error:", e);
    return null;
  }
}

export async function getPosts(first = 10) {
  const data = await gql(`{
    posts(first: ${first}) {
      nodes {
        databaseId slug title date excerpt
        featuredImage { node { sourceUrl altText } }
      }
    }
  }`);
  return data?.posts?.nodes ?? [];
}

export async function getEtudesDeCas(first = 10) {
  const data = await gql(`{
    etudesDeCas(first: ${first}) {
      nodes {
        databaseId slug title date excerpt
        featuredImage { node { sourceUrl altText } }
      }
    }
  }`);
  return data?.etudesDeCas?.nodes ?? [];
}

export async function getRessources(first = 10) {
  const data = await gql(`{
    ressources(first: ${first}) {
      nodes {
        databaseId slug title date excerpt
        featuredImage { node { sourceUrl altText } }
      }
    }
  }`);
  return data?.ressources?.nodes ?? [];
}
