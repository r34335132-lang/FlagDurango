"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface User {
  id: string
  username: string
  email: string
  role: string
  status: string
  created_at: string
  updated_at: string
}

export default function DebugPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/debug/users")
      const data = await response.json()
      if (data.success) {
        setUsers(data.data)
      } else {
        setError(data.message || "Failed to fetch users")
      }
    } catch (err) {
      console.error("Error fetching users:", err)
      setError("Network error or server is unreachable.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Debug - User Data</h1>
        <Button onClick={fetchUsers} className="mb-4 w-full md:w-auto">
          Refresh Users
        </Button>
        {loading && <p className="text-center">Loading users...</p>}
        {error && <p className="text-red-500 text-center">{error}</p>}
        {!loading && !error && users.length === 0 && <p className="text-center">No users found.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <CardTitle className="text-lg">{user.username}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>
                  <strong>ID:</strong> {user.id}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Role:</strong> <span className="font-semibold text-blue-600">{user.role}</span>
                </p>
                <p>
                  <strong>Status:</strong> <span className="font-semibold text-green-600">{user.status}</span>
                </p>
                <p>
                  <strong>Created At:</strong> {new Date(user.created_at).toLocaleString()}
                </p>
                <p>
                  <strong>Updated At:</strong> {new Date(user.updated_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
