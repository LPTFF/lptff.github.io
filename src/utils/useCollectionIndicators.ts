import { ref } from "vue";
export function useCollectionIndicators() {
  const collectionStatuses = ref<Record<string, { state: string; label: string }>>({});
  const collectionDetails = ref<HTMLDetailsElement>();
  function revealCollection(source: string) {
    const platform = source.replace(/^direct:/, "");
    const status = collectionStatuses.value[platform];
    if (status && status.state !== "fresh" && collectionDetails.value) collectionDetails.value.open = true;
  }
  return { collectionStatuses, collectionDetails, revealCollection };
}
