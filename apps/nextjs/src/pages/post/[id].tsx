import Head from 'next/head';

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

  // Fetch post data here

  return (
    <>
      <OpenGraph
        title={`Post Title - Your App Name`}
        description="Post description or excerpt"
        image="https://cdn.discordapp.com/attachments/1002773521975480371/1297021528910729236/part3-moving-state-down.png?ex=671511ad&is=6713c02d&hm=3f117fe3c5c015029c741b00da9e123f345da7407f05c62760e74a0c789dadeb&"
        url={`https://your-domain.com/post/${id}`}
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

