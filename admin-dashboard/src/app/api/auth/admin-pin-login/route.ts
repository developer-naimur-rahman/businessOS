import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const pin = (body.pin || body.password || '').trim()

    // 1. Admin PIN
    if (pin === "5825825825iW." || pin === "admin123") {
      const user = {
        userId: "567ac770-fdde-4df0-96ca-f31fdcb42ebf",
        organizationId: "f3281531-1153-4a8f-92b1-5f2b5f2efb60",
        email: "admin@demo.local",
        firstName: "Admin",
        lastName: "Demo",
        roleIds: ["admin"],
        permissions: ["*"]
      }
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NjdhYzcxMCJ9.mock_admin_token"
      return NextResponse.json({
        access_token: token,
        token,
        organizationId: user.organizationId,
        user
      })
    }

    // 2. Staff Quick PINs
    const staffPinMap: Record<string, any> = {
      'manager1': { id: 'b0f66631', email: 'manager@demo.local', firstName: 'Manager', role: 'manager' },
      '9999': { id: 'b0f66631', email: 'manager@demo.local', firstName: 'Manager', role: 'manager' },
      'sales123': { id: 'cef6e64d', email: 'sales@demo.local', firstName: 'Sales', role: 'sales' },
      'cashier123': { id: 'cef6e64d', email: 'sales@demo.local', firstName: 'Sales', role: 'sales' },
      '5678': { id: 'cef6e64d', email: 'sales@demo.local', firstName: 'Sales', role: 'sales' },
      'inv12345': { id: '719192ff', email: 'inventory@demo.local', firstName: 'Inventory', role: 'inventory' },
      '7777': { id: '719192ff', email: 'inventory@demo.local', firstName: 'Inventory', role: 'inventory' },
      'staff123': { id: '42c73cd0', email: 'staff@demo.local', firstName: 'Staff', role: 'staff' },
      '1234': { id: '42c73cd0', email: 'staff@demo.local', firstName: 'Staff', role: 'staff' },
    }

    const matched = staffPinMap[pin]
    if (matched) {
      const user = {
        userId: matched.id,
        organizationId: "f3281531-1153-4a8f-92b1-5f2b5f2efb60",
        email: matched.email,
        firstName: matched.firstName,
        lastName: "Demo",
        roleIds: [matched.role],
        permissions: ["sales.*", "inventory.*", "catalog.*"]
      }
      const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_${matched.role}_token`
      return NextResponse.json({
        access_token: token,
        token,
        organizationId: user.organizationId,
        user
      })
    }

    return NextResponse.json({ message: "Invalid Security PIN" }, { status: 401 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Auth error" }, { status: 500 })
  }
}
