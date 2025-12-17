import DogCard from "../../../components/dog-card";

export default async function Apply() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-foreground">Clubs:</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DogCard />
        <DogCard />
        <DogCard />
        <DogCard />
        <DogCard />
      </div>
    </>
  );
}
