import Head from 'next/head';
import { api } from '~/utils/api';
import Image from 'next/image';

interface OpenGraphProps {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
}

import { useRouter } from 'next/router';

const PostPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  // Check if the router is ready and id is available
  const isReady = router.isReady && typeof id === 'string';

  const { data: post, isLoading } = api.post.getPostForNextJs.useQuery(
    { postId: id as string },
    { enabled: isReady }
  );

  return (
    <>
      <OpenGraph
        title={post ? `${post.authorUsername} opped ${post.recipientUsername}` : "Loading..."}
        description={post ? post.caption ?? "broken description" : "Loading..."}
        image={post ? post.imageUrl ?? "broken image" : "/default-image.png"}
        url={`https://opp.oppfy.app/post/${id}`}
        type="article"
      />
      {(!isReady || isLoading) ? (
        <div>Loading...</div> // Or any loading component
      ) : !post ? (
        <div>Post not found</div> // Or any error component
      ) : (
        <Image src={post.imageUrl} alt={`${post.authorUsername} opped ${post.recipientUsername}`} width={500} height={500} />
      )}
    </>
  );
};

const OpenGraph: React.FC<OpenGraphProps> = ({ title, description, image, url, type = 'website' }) => {
  return (
    <Head>
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
  );
};

export default PostPage;
