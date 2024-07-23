import { useSession } from "~/contexts/SessionContext";
import { api } from "~/utils/api";

const useView = () => {
  const viewProfile = (profileId: string) => {
    
  };

  const viewPost = (postId: string) => {
    console.log("Viewing post", postId);
  };

  return { viewProfile, viewPost };
};
