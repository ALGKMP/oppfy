import Head from 'next/head';
import { api } from '~/utils/api';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

interface OpenGraphProps {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
}

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

const PostPage: React.FC = () => {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      setIsReady(true);
    }
  }, [router.isReady]);

  const { id } = router.query;
  const { data: post, isLoading, isError } = api.post.getPostForNextJs.useQuery(
    { postId: id as string },
    { enabled: isReady && !!id }
  );

  if (!isReady || isLoading) {
    return <div>Loading...</div>;
  }

  if (isError || !post) {
    return <div>Error loading post</div>;
  }

  const baseUrl = 'https://opp.oppfy.app';

  return (
    <>
      <OpenGraph
        title={`${post.authorUsername} opped ${post.recipientUsername}`}
        description={post.caption || "No caption provided"}
        image={post.imageUrl || `${baseUrl}/default-image.jpg`}
        url={`${baseUrl}/post/${id}`}
        type="article"
      />
      <h1>{post.authorUsername} opped {post.recipientUsername}</h1>
      <p>{post.caption || "No caption provided"}</p>
      {post.imageUrl && <img src={post.imageUrl} alt="Post image" />}
    </>
  );
};

export default PostPage;