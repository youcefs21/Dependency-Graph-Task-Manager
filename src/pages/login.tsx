import { useSession, signIn, signOut } from "next-auth/react"

export default function Component() {
  const { data: session } = useSession()
    return (
      <div className="text-white w-1/2 text-center m-auto my-16">
        { session ? <>Signed in as {session.user?.name} <br /></>: <>Not Signed In <br/> </>}
        <button onClick={() => session ? signOut() : signIn()} className="bg-black p-2 rounded-lg">
          {session ? "Sign out" : "Sign In"}
        </button>
      </div>
    )
}
