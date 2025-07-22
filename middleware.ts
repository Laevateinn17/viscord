import { NextRequest, NextResponse } from "next/server";



export default function middleware(request: NextRequest) {
    // const {user} = useAuth();

    return NextResponse.next();
}