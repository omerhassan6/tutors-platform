import React, { useEffect, useState } from 'react'

export default function Home() {
  const [users, setUsers] = useState<any[]>([])
  useEffect(() => {
    fetch('http://localhost:3001/users')
      .then(r => r.json())
      .then(setUsers)
      .catch(() => setUsers([]))
  }, [])

  return (
    <main style={{padding: 24}}>
      <h1>Tutors Platform — Next.js frontend</h1>
      <p>Backend: <a href="http://localhost:3001">NestJS on port 3001</a></p>
      <h2>Users</h2>
      {users.length === 0 ? (
        <p>No users or failed to fetch.</p>
      ) : (
        <ul>
          {users.map(u => (
            <li key={u.id}>{u.email || u.id}</li>
          ))}
        </ul>
      )}
    </main>
  )
}
