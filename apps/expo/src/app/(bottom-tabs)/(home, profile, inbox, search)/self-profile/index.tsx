const onViewableItemsChanged = ({
  viewableItems,
}: {
  viewableItems: ViewToken[];
}) => {
  const visibleItemIds = viewableItems
    .filter((token) => token.isViewable)
    .map((token) => (token.item as Post)?.postId)
    .filter((id): id is string => id !== undefined);

  setViewableItems(visibleItemIds);
};
