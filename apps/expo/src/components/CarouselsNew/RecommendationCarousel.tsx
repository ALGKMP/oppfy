import * as Haptics from "expo-haptics";
import { api } from "~/utils/api";
import Carousel from "./Carousel";

/*
 * TODO: Can make this a compound component later if we want to add more styles
 * or if we want to add more functionality to the carousel.
 * For example
 * - Turning the show more on and off
 * - Big cards and small cards
 */

function RecommendationCarousel() {
  const {
    data: recommendationsData,
    isLoading: isLoadingRecommendationsData,
    refetch: refetchRecommendations,
  } = api.contacts.getRecommendationProfilesSelf.useQuery();
  const recommendationsItems = recommendationsData ?? [];

  const onShowMore = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Recommendations page
    // router.push({
    //   pathname: "/",
    // });
  };

  return (
    <Carousel
      title="Recommendations"
      onShowMore={onShowMore}
      isLoading={isLoadingRecommendationsData}
      data={recommendationsItems}
    />
  );
}

export default RecommendationCarousel;
