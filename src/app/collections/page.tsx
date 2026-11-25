import { getPublishedCmsData } from '../../lib/cms/serverCms';
import CollectionsClientView from '../../components/collections/CollectionsClientView';

export const revalidate = 60;

export default async function CollectionsPage() {
  const { data: cmsData } = await getPublishedCmsData();
  return <CollectionsClientView initialProducts={cmsData.products} />;
}
