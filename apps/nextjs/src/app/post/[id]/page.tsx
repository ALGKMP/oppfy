import { Metadata } from 'next'
import Image from 'next/image'
import { api } from '~/trpc/server'

interface Props {
  params: {
    id: string
  }
}

// Generate metadata for the page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await api.post.getPostForNextJs({ postId: params.id })
  console.log(post)
  
  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested post could not be found'
    }
  }

  return {
    title: `${post.authorUsername} opped ${post.recipientUsername}`,
    description: post.caption ?? "No caption",
    openGraph: {
      title: `${post.authorUsername} opped ${post.recipientUsername}`,
      description: post.caption ?? "No caption",
      images: [
        {
          url: post.imageUrl,
          width: 1200,
          height: 630,
          alt: `${post.authorUsername} opped ${post.recipientUsername}`
        }
      ],
      type: 'article',
      url: `https://opp.oppfy.app/post/${post.postId}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.authorUsername} opped ${post.recipientUsername}`,
      description: post.caption ?? "No caption",
      images: [post.imageUrl],
    }
  }
}

// Main page component
export default async function PostPage({ params }: Props) {
  const post = await api.post.getPostForNextJs({ postId: params.id })
 
  if (!post) {
    return <div>Post not found</div>
  }

  return (
    <div>
      <Image 
        src={post.imageUrl} 
        alt={`${post.authorUsername} opped ${post.recipientUsername}`}
        width={500}
        height={500}
        priority
      />
      <h1>{post.authorUsername} opped {post.recipientUsername}</h1>
      {post.caption && <p>{post.caption}</p>}
    </div>
  )
}