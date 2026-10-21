import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '').trim()

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  let role = "admin"
  let firstName = "Admin"
  if (token.includes("manager")) { role = "manager"; firstName = "Manager" }
  else if (token.includes("sales") || token.includes("cashier")) { role = "sales"; firstName = "Sales" }
  else if (token.includes("inventory")) { role = "inventory"; firstName = "Inventory" }
  else if (token.includes("staff")) { role = "staff"; firstName = "Staff" }

  return NextResponse.json({
    userId: `user-${role}-id`,
    organizationId: "f3281531-1153-4a8f-92b1-5f2b5f2efb60",
    email: `${role}@demo.local`,
    firstName,
    lastName: "Demo",
    roleIds: [role],
    permissions: role === "admin" ? ["*"] : role === "manager" ? ["businesscore.*", "iam.*", "sales.*", "inventory.*", "catalog.*"] : ["sales.*", "inventory.*", "catalog.*"]
  })
}
