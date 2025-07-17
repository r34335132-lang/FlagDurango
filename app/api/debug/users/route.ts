import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data: users, error } = await supabase.from("users").select("*")

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ success: false, message: "Error fetching users" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ success: false, message: "An unexpected error occurred" }, { status: 500 })
  }
}
