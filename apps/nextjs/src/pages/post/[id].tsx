import Head from 'next/head';
import { api } from '~/utils/api';

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
  console.log(id);
  const { data: post } = api.post.getPostForNextJs.useQuery({ postId: id as string });

  // Fetch post data here

  return (
    <>
      <OpenGraph
        title={`${post?.authorUsername} opped ${post?.recipientUsername}`}
        description={post?.caption ?? ""}
        image={post?.imageUrl ?? ""}
        url={`https://opp.oppfy.app/post/${id}`}
        type="article"
      />
      {/* Rest of your component */}
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

