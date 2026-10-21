import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = (body.email || '').trim().toLowerCase()
    const password = body.password || ''

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    // Known staff demo accounts
    let role = "staff"
    let firstName = "Staff"
    if (email.includes("admin")) { role = "admin"; firstName = "Admin" }
    else if (email.includes("manager")) { role = "manager"; firstName = "Manager" }
    else if (email.includes("sales") || email.includes("cashier")) { role = "sales"; firstName = "Sales" }
    else if (email.includes("inventory")) { role = "inventory"; firstName = "Inventory" }

    const user = {
      userId: `user-${role}-id`,
      organizationId: "f3281531-1153-4a8f-92b1-5f2b5f2efb60",
      email,
      firstName,
      lastName: "Demo",
      roleIds: [role],
      permissions: role === "admin" ? ["*"] : ["sales.*", "inventory.*", "catalog.*"]
    }

    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_${role}_token`
    return NextResponse.json({
      access_token: token,
      token,
      organizationId: user.organizationId,
      user
    })
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Login error" }, { status: 500 })
  }
}
