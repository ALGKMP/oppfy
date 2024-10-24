import Head from 'next/head';
import { api } from '~/utils/api';
import Image from 'next/image';
import { GetServerSideProps } from 'next';
import { RouterOutputs } from '~/utils/api';

interface OpenGraphProps {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
}

type PostType = RouterOutputs['post']['getPostForNextJs'];

const PostPage: React.FC<{ post: PostType | null }> = ({ post }) => {
  return (
    <>
      <OpenGraph
        title={post ? `${post.authorUsername} opped ${post.recipientUsername}` : "Post not found"}
        description={post ? post.caption ?? "broken description" : "No description available"}
        image={post ? post.imageUrl ?? "broken image" : "/default-image.png"}
        url={`https://opp.oppfy.app/post/${post?.id}`}
        type="article"
      />
      {!post ? (
        <div>Post not found</div> // Or any error component
      ) : (
        <Image src={post.imageUrl} alt={`${post.authorUsername} opped ${post.recipientUsername}`} width={500} height={500} />
      )}
    </>
  );
};

const OpenGraph: React.FC<OpenGraphProps> = ({ title, description, image, url, type = 'article' }) => {
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params || {}; // Add a default empty object
  if (!id) {
    return {
      notFound: true, // Return a 404 page if id is not found
    };
  }
  const post = api.post.getPostForNextJs.useQuery({ postId: id as string });

  return {
    props: {
      post,
    },
  };
};

export default PostPage;
