import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    console.log("🔍 Fetching staff...")

    const { data: staff, error } = await supabase
      .from("staff")
      .select(`
        *,
        user:users(username, email, status)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching staff:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log(`✅ Found ${staff?.length || 0} staff members`)
    return NextResponse.json({ success: true, data: staff || [] })
  } catch (error) {
    console.error("💥 Error in staff GET:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log("📝 Creating new staff member...")
    const body = await request.json()
    console.log("📋 Staff data:", body)

    const { name, role, phone, email, password, can_edit_games, can_edit_scores, can_manage_payments } = body

    if (!name || !role) {
      console.log("❌ Missing required fields")
      return NextResponse.json(
        {
          success: false,
          message: "Nombre y rol son requeridos",
        },
        { status: 400 },
      )
    }

    // Valores permitidos para role
    const validRoles = ["admin", "staff", "coordinator"]
    const safeRole = validRoles.includes(role) ? role : "staff"

    // Create staff without user if no email provided
    if (!email) {
      const { data: staff, error } = await supabase
        .from("staff")
        .insert([
          {
            name: name,
            role: safeRole,
            phone: phone || null,
            email: null,
            can_edit_games: can_edit_games || false,
            can_edit_scores: can_edit_scores || false,
            can_manage_payments: can_manage_payments || false,
            user_id: null,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("❌ Error creating staff:", error)
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
      }

      console.log("✅ Staff created successfully without user:", staff.id)
      return NextResponse.json({
        success: true,
        data: staff,
      })
    }

    // Verificar si el email ya existe en staff
    const { data: existingStaff } = await supabase.from("staff").select("id").eq("email", email).maybeSingle()
    if (existingStaff) {
      return NextResponse.json({ success: false, message: "Ya existe un staff con este email" }, { status: 400 })
    }

    // Verificar si el email ya existe en referees
    const { data: existingReferee } = await supabase.from("referees").select("id").eq("email", email).maybeSingle()
    if (existingReferee) {
      return NextResponse.json({ success: false, message: "Ya existe un árbitro con este email" }, { status: 400 })
    }

    // PASO 1: Crear staff PRIMERO con user_id null
    const { data: staff, error: staffError } = await supabase
      .from("staff")
      .insert([
        {
          name: name,
          role: safeRole,
          phone: phone || null,
          email: email,
          can_edit_games: can_edit_games || false,
          can_edit_scores: can_edit_scores || false,
          can_manage_payments: can_manage_payments || false,
          user_id: null,
        },
      ])
      .select()
      .single()

    if (staffError) {
      console.error("❌ Error creating staff:", staffError)
      return NextResponse.json({ success: false, message: staffError.message }, { status: 500 })
    }

    console.log("✅ Staff creado con ID:", staff.id)

    // PASO 2: Verificar si el email ya existe en users
    const { data: existingUser } = await supabase.from("users").select("id, username").eq("email", email).maybeSingle()

    let userId = null
    let createdNewUser = false

    if (existingUser) {
      // Verificar si el usuario ya está asociado a un referee
      const { data: refWithUser } = await supabase
        .from("referees")
        .select("id")
        .eq("user_id", existingUser.id)
        .maybeSingle()

      // Verificar si el usuario ya está asociado a otro staff
      const { data: staffWithUser } = await supabase
        .from("staff")
        .select("id")
        .eq("user_id", existingUser.id)
        .neq("id", staff.id) // Excluir el staff que acabamos de crear
        .maybeSingle()

      if (refWithUser || staffWithUser) {
        // Rollback: eliminar el staff que creamos
        await supabase.from("staff").delete().eq("id", staff.id)
        return NextResponse.json(
          {
            success: false,
            message: "Este email ya está asociado a otro usuario en el sistema",
          },
          { status: 400 },
        )
      }

      // Si el usuario existe pero no está asociado, usamos ese ID
      userId = existingUser.id
      console.log("✅ Usando usuario existente con ID:", userId)
    } else {
      // PASO 3: Crear nuevo usuario si no existe
      const finalPassword = password || Math.random().toString(36).slice(-8)
      const hashedPassword = await bcrypt.hash(finalPassword, 10)

      // Create username from name with timestamp to avoid duplicates
      const timestamp = new Date().getTime().toString().slice(-4)
      const username = name.toLowerCase().replace(/\s+/g, "") + "_staff" + timestamp

      const { data: user, error: userError } = await supabase
        .from("users")
        .insert([
          {
            username: username,
            email: email,
            password_hash: hashedPassword,
            role: safeRole,
            status: "active",
          },
        ])
        .select()
        .single()

      if (userError) {
        console.error("❌ Error creating user:", userError)
        // Rollback: eliminar el staff que creamos
        await supabase.from("staff").delete().eq("id", staff.id)
        return NextResponse.json({ success: false, message: userError.message }, { status: 500 })
      }

      userId = user.id
      createdNewUser = true
      console.log("✅ Usuario creado con ID:", userId)
    }

    // PASO 4: Actualizar staff con el user_id
    const { error: updateError } = await supabase.from("staff").update({ user_id: userId }).eq("id", staff.id)

    if (updateError) {
      console.error("❌ Error updating staff with user_id:", updateError)

      // Rollback: eliminar usuario solo si lo creamos nosotros
      if (createdNewUser && userId) {
        await supabase.from("users").delete().eq("id", userId)
        console.log("🔄 Rollback: Usuario eliminado")
      }

      // Eliminar el staff
      await supabase.from("staff").delete().eq("id", staff.id)
      console.log("🔄 Rollback: Staff eliminado")

      return NextResponse.json({ success: false, message: updateError.message }, { status: 500 })
    }

    console.log("✅ Staff actualizado con user_id:", userId)

    // PASO 5: Obtener datos completos del staff
    const { data: completeStaff, error: fetchError } = await supabase
      .from("staff")
      .select(`
        *,
        user:users(username, email, status)
      `)
      .eq("id", staff.id)
      .single()

    if (fetchError) {
      console.error("❌ Error fetching complete staff data:", fetchError)
      return NextResponse.json({ success: false, message: fetchError.message }, { status: 500 })
    }

    console.log("✅ Staff creation completed successfully!")
    console.log("📊 Staff ID:", staff.id)
    console.log("👤 User ID:", userId)

    const response: any = { success: true, data: completeStaff }

    // Solo incluir información de contraseña si creamos un nuevo usuario
    if (createdNewUser && password) {
      response.createdUser = {
        username: completeStaff.user.username,
        password: password,
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("💥 Error in staff POST:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, message: "ID es requerido" }, { status: 400 })
    }

    console.log("🗑️ Deleting staff:", id)

    // Get staff data to check if it has a user_id
    const { data: staff } = await supabase.from("staff").select("user_id").eq("id", id).single()

    // Delete the staff
    const { error: staffError } = await supabase.from("staff").delete().eq("id", id)

    if (staffError) {
      console.error("❌ Error deleting staff:", staffError)
      return NextResponse.json({ success: false, message: staffError.message }, { status: 500 })
    }

    // If staff had a user account, delete it too
    if (staff?.user_id) {
      const { error: userError } = await supabase.from("users").delete().eq("id", staff.user_id)
      if (userError) {
        console.error("⚠️ Warning: Could not delete associated user:", userError)
      }
    }

    console.log("✅ Staff deleted successfully:", id)
    return NextResponse.json({ success: true, message: "Staff eliminado exitosamente" })
  } catch (error) {
    console.error("💥 Error in staff DELETE:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}
