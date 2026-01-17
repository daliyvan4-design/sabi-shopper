import TransportClient from "./TransportClient";

export default function Page({ params }: { params: { id: string } }) {
  return <TransportClient id={params.id} />;
}
