import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    console.log("🔍 Fetching referees...")

    const { data: referees, error } = await supabase
      .from("referees")
      .select(`
        *,
        user:users(username, email, status)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching referees:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log(`✅ Found ${referees?.length || 0} referees`)
    return NextResponse.json({ success: true, data: referees || [] })
  } catch (error) {
    console.error("💥 Error in referees GET:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log("📝 Creating new referee...")
    const body = await request.json()
    console.log("📋 Referee data:", body)

    const { name, phone, email, password, license_number, certification_level, experience_level, hourly_rate } = body

    if (!name) {
      console.log("❌ Missing required fields")
      return NextResponse.json(
        {
          success: false,
          message: "Nombre es requerido",
        },
        { status: 400 },
      )
    }

    // Valores permitidos según las restricciones de la base de datos
    const validCertificationLevels = ["junior", "senior", "expert"]
    const safeCertificationLevel = validCertificationLevels.includes(certification_level)
      ? certification_level
      : "junior"

    // SIEMPRE poner experience_level como NULL para evitar problemas
    const safeExperienceLevel = null

    // Create referee without user if no email provided
    if (!email) {
      const { data: referee, error } = await supabase
        .from("referees")
        .insert([
          {
            name: name,
            phone: phone || null,
            email: null,
            license_number: license_number || null,
            certification_level: safeCertificationLevel,
            experience_level: safeExperienceLevel,
            hourly_rate: hourly_rate ? Number.parseFloat(hourly_rate) : null,
            status: "active",
            user_id: null,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("❌ Error creating referee:", error)
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
      }

      console.log("✅ Referee created successfully without user:", referee.id)
      return NextResponse.json({
        success: true,
        data: referee,
      })
    }

    // Verificar si el email ya existe en referees
    const { data: existingReferee } = await supabase.from("referees").select("id").eq("email", email).maybeSingle()
    if (existingReferee) {
      return NextResponse.json({ success: false, message: "Ya existe un árbitro con este email" }, { status: 400 })
    }

    // Verificar si el email ya existe en staff
    const { data: existingStaff } = await supabase.from("staff").select("id").eq("email", email).maybeSingle()
    if (existingStaff) {
      return NextResponse.json({ success: false, message: "Ya existe un staff con este email" }, { status: 400 })
    }

    // PASO 1: Crear el referee PRIMERO (como en tu SQL de prueba)
    console.log("🏗️ Creating referee first...")
    const { data: referee, error: refereeError } = await supabase
      .from("referees")
      .insert([
        {
          name: name,
          phone: phone || null,
          email: email,
          license_number: license_number || null,
          certification_level: safeCertificationLevel,
          experience_level: safeExperienceLevel, // NULL
          hourly_rate: hourly_rate ? Number.parseFloat(hourly_rate) : null,
          status: "active",
          user_id: null, // Inicialmente null
        },
      ])
      .select()
      .single()

    if (refereeError) {
      console.error("❌ Error creating referee:", refereeError)
      return NextResponse.json({ success: false, message: refereeError.message }, { status: 500 })
    }

    console.log("✅ Referee created with ID:", referee.id)

    // PASO 2: Verificar si ya existe un usuario con este email
    const { data: existingUser } = await supabase.from("users").select("id, username").eq("email", email).maybeSingle()

    let userId = null

    if (existingUser) {
      // Verificar si el usuario ya está asociado a otro referee o staff
      const { data: refWithUser } = await supabase
        .from("referees")
        .select("id")
        .eq("user_id", existingUser.id)
        .neq("id", referee.id) // Excluir el referee que acabamos de crear
        .maybeSingle()

      const { data: staffWithUser } = await supabase
        .from("staff")
        .select("id")
        .eq("user_id", existingUser.id)
        .maybeSingle()

      if (refWithUser || staffWithUser) {
        // Rollback: eliminar el referee que creamos
        await supabase.from("referees").delete().eq("id", referee.id)
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
      console.log("👤 Creating new user...")
      const finalPassword = password || Math.random().toString(36).slice(-8)
      const hashedPassword = await bcrypt.hash(finalPassword, 10)

      // Create username from name with timestamp to avoid duplicates
      const timestamp = new Date().getTime().toString().slice(-4)
      const username = name.toLowerCase().replace(/\s+/g, "") + "_ref" + timestamp

      const { data: user, error: userError } = await supabase
        .from("users")
        .insert([
          {
            username: username,
            email: email,
            password_hash: hashedPassword,
            role: "referee",
            status: "active",
          },
        ])
        .select()
        .single()

      if (userError) {
        console.error("❌ Error creating user:", userError)
        // Rollback: eliminar el referee que creamos
        await supabase.from("referees").delete().eq("id", referee.id)
        return NextResponse.json({ success: false, message: userError.message }, { status: 500 })
      }

      userId = user.id
      console.log("✅ Usuario creado con ID:", userId)
    }

    // PASO 4: Actualizar el referee con el user_id
    console.log("🔗 Linking referee to user...")
    const { error: updateError } = await supabase.from("referees").update({ user_id: userId }).eq("id", referee.id)

    if (updateError) {
      console.error("❌ Error updating referee with user_id:", updateError)
      // Rollback: eliminar usuario si lo creamos nosotros
      if (!existingUser) {
        await supabase.from("users").delete().eq("id", userId)
      }
      await supabase.from("referees").delete().eq("id", referee.id)
      return NextResponse.json({ success: false, message: updateError.message }, { status: 500 })
    }

    // PASO 5: Obtener los datos completos del referee
    const { data: completeReferee, error: fetchError } = await supabase
      .from("referees")
      .select(`
        *,
        user:users(username, email, status)
      `)
      .eq("id", referee.id)
      .single()

    if (fetchError) {
      console.error("❌ Error fetching complete referee data:", fetchError)
      return NextResponse.json({ success: false, message: fetchError.message }, { status: 500 })
    }

    console.log("✅ Referee creation completed successfully!")
    console.log("📊 Referee ID:", referee.id)
    console.log("👤 User ID:", userId)

    const response: any = { success: true, data: completeReferee }

    // Solo incluir información de contraseña si creamos un nuevo usuario
    if (!existingUser && password) {
      response.createdUser = {
        username: completeReferee.user.username,
        password: password,
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("💥 Error in referees POST:", error)
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

    console.log("🗑️ Deleting referee:", id)

    // Get referee data to check if it has a user_id
    const { data: referee } = await supabase.from("referees").select("user_id").eq("id", id).single()

    // Delete the referee
    const { error: refereeError } = await supabase.from("referees").delete().eq("id", id)

    if (refereeError) {
      console.error("❌ Error deleting referee:", refereeError)
      return NextResponse.json({ success: false, message: refereeError.message }, { status: 500 })
    }

    // If referee had a user account, delete it too
    if (referee?.user_id) {
      const { error: userError } = await supabase.from("users").delete().eq("id", referee.user_id)
      if (userError) {
        console.error("⚠️ Warning: Could not delete associated user:", userError)
      }
    }

    console.log("✅ Referee deleted successfully:", id)
    return NextResponse.json({ success: true, message: "Árbitro eliminado exitosamente" })
  } catch (error) {
    console.error("💥 Error in referees DELETE:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}
