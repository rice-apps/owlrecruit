import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card"
import dog from '../images/dog.jpeg'
import { Button } from "./ui/button"
import Link from "next/link"

export default async function DogCard() {
    return (
<Card className="w-full flex flex-col items-center text-center">
            <CardHeader className="flex flex-col items-center space-y-4">
    <Image src={dog} alt="dog" width={100} height={100} />
    <CardTitle>Dog Club</CardTitle>
    <CardDescription>
      A club that really loves dogs and being a club!
    </CardDescription>
  </CardHeader>
  <CardFooter className="flex justify-center">
    <Button asChild>
      <Link href="/protected/apply/dogClub">Apply!</Link>
    </Button>
  </CardFooter>
        </Card>)}
