import { useState, useEffect } from 'react'

const API = 'https://fastapi-study-production.up.railway.app'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  function login() {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)

    fetch(`${API}/login`, {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.access_token) {
          onLogin(data.access_token)
        } else {
          alert('로그인 실패!')
        }
      })
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-5 text-blue-500">로그인</h1>
        <input
          className="w-full border rounded p-2 mb-4"
          placeholder="아이디"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          className="w-full border rounded p-2 mb-4"
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <button
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          onClick={login}
        >
          로그인
        </button>
      </div>
    </div>
  )
}

function Items({ token, onLogout }) {
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState('')

  useEffect(() => {
    fetchItems()
  }, [])

  function fetchItems() {
    fetch(`${API}/items`)
      .then(res => res.json())
      .then(data => setItems(data))
  }

  function addItem() {
    fetch(`${API}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: newItem })
    }).then(() => {
      setNewItem('')
      fetchItems()
    })
  }

  function deleteItem(id) {
    fetch(`${API}/items/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(() => fetchItems())
  }

  function uploadExcel(e) {
    const file = e.target.files[0]
    const formData = new FormData()
    formData.append('file', file)

    fetch(`${API}/upload-excel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }).then(() => {
      fetchItems()
      e.target.value = ''
    })
  }

  function downloadExcel() {
    fetch(`${API}/download-excel`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'items.xlsx'
        a.click()
      })
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">아이템 목록</h1>
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            onClick={onLogout}
          >
            로그아웃
          </button>
        </div>
        <div className="flex gap-2 mb-6">
          <input
            className="flex-1 border rounded p-2"
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            placeholder="아이템 이름"
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={addItem}
          >
            추가
          </button>
        </div>
        <div className="flex gap-2 mb-6">
          <label className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-900 cursor-pointer">
            엑셀 업로드
            <input type="file" className="hidden" onChange={uploadExcel} />
          </label>
          <button
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-900"
            onClick={downloadExcel}
          >
            엑셀 다운로드
          </button>
        </div>
        <ul className="space-y-2">
          {items.map(item => (
            <li key={item.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
              <span>{item.name}</span>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                onClick={() => deleteItem(item.id)}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function App() {
  const [token, setToken] = useState('')

  return (
    <div>
      {token ? (
        <Items token={token} onLogout={() => setToken('')} />
      ) : (
        <Login onLogin={setToken} />
      )}
    </div>
  )
}

export default App