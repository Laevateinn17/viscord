import { NextRequest, NextResponse } from "next/server";



export default function middleware(request: NextRequest) {
    // const {user} = useAuth();

    // console.log("user is ", user);
    return NextResponse.next();
}