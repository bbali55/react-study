import { useState, useEffect, useRef, useCallback } from 'react'
import { IconFileTypePdf, IconPhoto, IconFileSpreadsheet, IconFileWord, IconFileText, IconFile } from '@tabler/icons-react'

//const API = 'http://127.0.0.1:8000'
const API = 'https://fastapi-study-production.up.railway.app'

function Register({ onBack }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  function register() {
    fetch(`${API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.message) { alert(data.message); onBack() }
        else alert('회원가입 실패!')
      })
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-5 text-green-500">회원가입</h1>
        <input className="w-full border rounded p-2 mb-4" placeholder="아이디" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="w-full border rounded p-2 mb-4" type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
        <button className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 mb-2" onClick={register}>회원가입</button>
        <button className="w-full bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400" onClick={onBack}>로그인으로 돌아가기</button>
      </div>
    </div>
  )
}

function Login({ onLogin, onRegister }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  function login() {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    fetch(`${API}/login`, { method: 'POST', body: formData })
      .then(res => res.json())
      .then(data => {
        if (data.access_token) onLogin(data.access_token)
        else alert('로그인 실패!')
      })
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-5 text-blue-500">로그인</h1>
        <input className="w-full border rounded p-2 mb-4" placeholder="아이디" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="w-full border rounded p-2 mb-4" type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
        <button className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 mb-2" onClick={login}>로그인</button>
        <button className="w-full bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400" onClick={onRegister}>회원가입</button>
      </div>
    </div>
  )
}

function Dashboard({ token, onLogout }) {
  const [tab, setTab] = useState('items')

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-8 py-3 flex justify-between items-center">
        <div className="flex gap-4">
          <button className={`px-4 py-2 rounded font-medium ${tab==='items' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-gray-800'}`} onClick={() => setTab('items')}>아이템 목록</button>
          <button className={`px-4 py-2 rounded font-medium ${tab==='files' ? 'bg-purple-500 text-white' : 'text-gray-500 hover:text-gray-800'}`} onClick={() => setTab('files')}>파일 목록</button>
          <button className={`px-4 py-2 rounded font-medium ${tab==='etc' ? 'bg-green-500 text-white' : 'text-gray-500 hover:text-gray-800'}`} onClick={() => setTab('etc')}>기타 목록</button>
        </div>
        <button className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600" onClick={onLogout}>로그아웃</button>
      </div>
      <div className="p-8">
        {tab === 'items' && <ItemsTab token={token} />}
        {tab === 'files' && <FilesTab token={token} />}
        {tab === 'etc' && <div className="text-gray-400 text-center mt-20">기타 목록 준비 중...</div>}
      </div>
    </div>
  )
}

function useSelectable(items) {
  const [selectedIds, setSelectedIds] = useState([])
  const lastClickedIdx = useRef(null)

  function handleClick(e, id, idx) {
    if (e.shiftKey && lastClickedIdx.current !== null) {
      const start = Math.min(lastClickedIdx.current, idx)
      const end = Math.max(lastClickedIdx.current, idx)
      const rangeIds = items.slice(start, end + 1).map(i => i.id)
      setSelectedIds(prev => {
        const merged = new Set([...prev, ...rangeIds])
        return [...merged]
      })
    } else if (e.ctrlKey || e.metaKey) {
      setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      )
      lastClickedIdx.current = idx
    } else {
      setSelectedIds([id])
      lastClickedIdx.current = idx
    }
  }

  function clearSelection() {
    setSelectedIds([])
    lastClickedIdx.current = null
  }

  return { selectedIds, setSelectedIds, handleClick, clearSelection }
}

function DragSelectContainer({ children, items, selectedIds, setSelectedIds }) {
  const containerRef = useRef(null)
  const dragBox = useRef(null)
  const [box, setBox] = useState(null)

  function onMouseDown(e) {
  if (e.button !== 0) return
  const rect = containerRef.current.getBoundingClientRect()
  const startX = e.clientX - rect.left
  const startY = e.clientY - rect.top
  dragBox.current = { startX, startY }
  setBox(null)
  let moved = false

  function onMove(e) {
    const r = containerRef.current.getBoundingClientRect()
    const cur = { x: e.clientX - r.left, y: e.clientY - r.top }
    const dx = Math.abs(cur.x - dragBox.current.startX)
    const dy = Math.abs(cur.y - dragBox.current.startY)
    if (!moved && dx < 5 && dy < 5) return
    moved = true
    const b = {
      left: Math.min(dragBox.current.startX, cur.x),
      top: Math.min(dragBox.current.startY, cur.y),
      width: Math.abs(cur.x - dragBox.current.startX),
      height: Math.abs(cur.y - dragBox.current.startY),
    }
    setBox(b)

    const rows = containerRef.current.querySelectorAll('[data-row]')
    const selected = []
    rows.forEach(row => {
      const rr = row.getBoundingClientRect()
      const cr = containerRef.current.getBoundingClientRect()
      const rowLeft = rr.left - cr.left
      const rowTop = rr.top - cr.top
      const rowRight = rowLeft + rr.width
      const rowBottom = rowTop + rr.height
      const boxRight = b.left + b.width
      const boxBottom = b.top + b.height
      if (rowLeft < boxRight && rowRight > b.left && rowTop < boxBottom && rowBottom > b.top) {
        selected.push(Number(row.dataset.id))
      }
    })
    setSelectedIds(selected)
  }

  function onUp() {
    setBox(null)
    dragBox.current = null
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

  return (
    <div ref={containerRef} style={{ position: 'relative', userSelect: 'none' }} onMouseDown={onMouseDown}>
      {children}
      {box && (
        <div style={{
          position: 'absolute',
          left: box.left, top: box.top,
          width: box.width, height: box.height,
          background: 'rgba(59,130,246,0.15)',
          border: '1px solid rgba(59,130,246,0.5)',
          pointerEvents: 'none',
          zIndex: 10,
        }} />
      )}
    </div>
  )
}

function ItemsTab({ token }) {
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState('')
  const [columns, setColumns] = useState([
    { key: 'name',     label: '이름',     width: '180px' },
    { key: 'category', label: '카테고리', width: '120px' },
    { key: 'price',    label: '가격',     width: '100px' },
    { key: 'quantity', label: '수량',     width: '80px'  },
    { key: 'date',     label: '날짜',     width: '120px' },
  ])
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState(1)
  const [dragSrc, setDragSrc] = useState(null)
  const sortedItems = [...items].sort((a, b) => sortKey ? (a[sortKey] > b[sortKey] ? sortDir : -sortDir) : 0)
  const { selectedIds, setSelectedIds, handleClick, clearSelection } = useSelectable(sortedItems)

  useEffect(() => { fetchItems() }, [])

  function fetchItems() {
    fetch(`${API}/items`).then(res => res.json()).then(data => setItems(data))
  }

  function addItem() {
    fetch(`${API}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: newItem })
    }).then(() => { setNewItem(''); fetchItems() })
  }

  function deleteSelectedItems() {
    Promise.all(selectedIds.map(id =>
      fetch(`${API}/items/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
    )).then(() => { clearSelection(); fetchItems() })
  }

  function uploadExcel(e) {
    const file = e.target.files[0]
    const formData = new FormData()
    formData.append('file', file)
    fetch(`${API}/upload-excel`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    }).then(() => { fetchItems(); e.target.value = '' })
  }

  function downloadExcel() {
    fetch(`${API}/download-excel`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'items.xlsx'; a.click()
      })
  }

  function startResize(e, i) {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = parseInt(columns[i].width)
    function onMove(e) {
      const newWidth = Math.max(60, startWidth + e.clientX - startX) + 'px'
      setColumns(prev => prev.map((col, idx) => idx === i ? { ...col, width: newWidth } : col))
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex gap-2 mb-4">
        <input className="border rounded p-2 flex-1" value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="아이템 이름" />
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={addItem}>추가</button>
        <button
          className={`px-4 py-2 rounded ${selectedIds.length > 0 ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-300 text-gray-400 cursor-not-allowed'}`}
          onClick={() => selectedIds.length > 0 && deleteSelectedItems()}
          disabled={selectedIds.length === 0}
        >
          삭제 {selectedIds.length > 0 && `(${selectedIds.length})`}
        </button>
        <label className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 cursor-pointer">
          엑셀 업로드
          <input type="file" className="hidden" onChange={uploadExcel} />
        </label>
        <button className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700" onClick={downloadExcel}>엑셀 다운로드</button>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden text-sm">
        <div className="flex bg-gray-50 border-b border-gray-200">
          {columns.map((col, i) => (
            <div
              key={col.key}
              className={`px-3 py-2 text-gray-500 font-medium flex items-center gap-1 cursor-pointer hover:text-gray-800 ${sortKey === col.key ? 'text-blue-500' : ''}`}
              style={{ width: col.width, minWidth: col.width, position: 'relative' }}
              draggable
              onDragStart={() => setDragSrc(i)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => {
                const newCols = [...columns]
                const tmp = newCols[dragSrc]; newCols[dragSrc] = newCols[i]; newCols[i] = tmp
                setColumns(newCols); setDragSrc(null)
              }}
              onClick={() => {
                if (sortKey === col.key) setSortDir(d => d * -1)
                else { setSortKey(col.key); setSortDir(1) }
              }}
            >
              {col.label}
              <span className="text-xs text-gray-300">{sortKey === col.key ? (sortDir === 1 ? '▲' : '▼') : '⇅'}</span>
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px', cursor: 'col-resize', background: 'transparent' }}
                onMouseDown={e => startResize(e, i)} onClick={e => e.stopPropagation()} />
            </div>
          ))}
        </div>
        <DragSelectContainer items={sortedItems} selectedIds={selectedIds} setSelectedIds={setSelectedIds}>
          {sortedItems.map((item, idx) => (
            <div
              key={item.id}
              data-row data-id={item.id}
              className={`flex items-center cursor-pointer border-b border-gray-100 ${selectedIds.includes(item.id) ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
              onClick={e => handleClick(e, item.id, idx)}
            >
              {columns.map(col => (
                <div key={col.key} className="px-3 py-2 overflow-hidden text-ellipsis whitespace-nowrap" style={{ width: col.width, minWidth: col.width }}>
                  {col.key === 'name'     && <span>{item.name}</span>}
                  {col.key === 'category' && <span className="text-gray-500">{item.category}</span>}
                  {col.key === 'price'    && <span className="text-gray-500">{item.price}원</span>}
                  {col.key === 'quantity' && <span className="text-gray-500">{item.quantity}개</span>}
                  {col.key === 'date'     && <span className="text-gray-500">{item.date}</span>}
                </div>
              ))}
            </div>
          ))}
        </DragSelectContainer>
      </div>
    </div>
  )
}

function FilesTab({ token }) {
  const [files, setFiles] = useState([])
  const [columns, setColumns] = useState([
    { key: 'name', label: '이름',       width: '220px' },
    { key: 'date', label: '수정한 날짜', width: '150px' },
    { key: 'type', label: '유형',       width: '160px' },
  ])
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState(1)
  const [dragSrc, setDragSrc] = useState(null)
  const [preview, setPreview] = useState(null)
  const sortedFiles = [...files].sort((a, b) => sortKey ? (a[sortKey] > b[sortKey] ? sortDir : -sortDir) : 0)
  const { selectedIds, setSelectedIds, handleClick, clearSelection } = useSelectable(sortedFiles)

  useEffect(() => { fetchFiles() }, [])

  function fetchFiles() {
    fetch(`${API}/files`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json()).then(data => setFiles(data))
  }

  function uploadFile(e) {
    const file = e.target.files[0]
    const formData = new FormData()
    formData.append('file', file)
    fetch(`${API}/upload-file`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    }).then(() => { fetchFiles(); e.target.value = '' })
  }

  function downloadFile(id, filename) {
    fetch(`${API}/download-file/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        fetch(data.url).then(res => res.blob()).then(blob => {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url; a.download = filename; a.click()
        })
      })
  }

  function downloadSelectedFiles() {
    selectedIds.forEach(id => {
      const file = files.find(f => f.id === id)
      if (file) downloadFile(file.id, file.filename)
    })
  }

  function deleteSelectedFiles() {
    Promise.all(selectedIds.map(id =>
      fetch(`${API}/delete-file/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
    )).then(() => { clearSelection(); fetchFiles(); setPreview(null) })
  }

  function startResize(e, i) {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = parseInt(columns[i].width)
    function onMove(e) {
      const newWidth = Math.max(60, startWidth + e.clientX - startX) + 'px'
      setColumns(prev => prev.map((col, idx) => idx === i ? { ...col, width: newWidth } : col))
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function getIcon(contentType) {
    if (contentType?.includes('pdf')) return <IconFileTypePdf size={18} color="#E24B4A" />
    if (contentType?.includes('image')) return <IconPhoto size={18} color="#378ADD" />
    if (contentType?.includes('sheet') || contentType?.includes('excel')) return <IconFileSpreadsheet size={18} color="#3B6D11" />
    if (contentType?.includes('word')) return <IconFileWord size={18} color="#185FA5" />
    if (contentType?.includes('haansofthwp')) return <IconFileText size={18} color="#E24B4A" />
    return <IconFile size={18} color="#888780" />
  }

  function getTypeName(contentType) {
    if (contentType?.includes('pdf')) return 'PDF 문서'
    if (contentType?.includes('image/png')) return 'PNG 이미지'
    if (contentType?.includes('image/jpeg')) return 'JPEG 이미지'
    if (contentType?.includes('sheet') || contentType?.includes('excel')) return 'Excel 파일'
    if (contentType?.includes('word')) return 'Word 문서'
    if (contentType?.includes('text')) return '텍스트 파일'
    if (contentType?.includes('haansofthwp')) return 'HWP 문서'
    return contentType
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex gap-2 mb-4">
        <label className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 cursor-pointer">
          파일 업로드
          <input type="file" className="hidden" onChange={uploadFile} />
        </label>
        <button
          className={`px-4 py-2 rounded ${selectedIds.length > 0 ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-400 cursor-not-allowed'}`}
          onClick={() => selectedIds.length > 0 && downloadSelectedFiles()}
          disabled={selectedIds.length === 0}
        >
          다운로드 {selectedIds.length > 0 && `(${selectedIds.length})`}
        </button>
        <button
          className={`px-4 py-2 rounded ${selectedIds.length > 0 ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-300 text-gray-400 cursor-not-allowed'}`}
          onClick={() => selectedIds.length > 0 && deleteSelectedFiles()}
          disabled={selectedIds.length === 0}
        >
          삭제 {selectedIds.length > 0 && `(${selectedIds.length})`}
        </button>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden text-sm">
        <div className="flex bg-gray-50 border-b border-gray-200">
          {columns.map((col, i) => (
            <div
              key={col.key}
              className={`px-3 py-2 text-gray-500 font-medium flex items-center gap-1 cursor-pointer hover:text-gray-800 ${sortKey === col.key ? 'text-blue-500' : ''}`}
              style={{ width: col.width, minWidth: col.width, position: 'relative' }}
              draggable
              onDragStart={() => setDragSrc(i)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => {
                const newCols = [...columns]
                const tmp = newCols[dragSrc]; newCols[dragSrc] = newCols[i]; newCols[i] = tmp
                setColumns(newCols); setDragSrc(null)
              }}
              onClick={() => {
                if (sortKey === col.key) setSortDir(d => d * -1)
                else { setSortKey(col.key); setSortDir(1) }
              }}
            >
              {col.label}
              <span className="text-xs text-gray-300">{sortKey === col.key ? (sortDir === 1 ? '▲' : '▼') : '⇅'}</span>
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px', cursor: 'col-resize', background: 'transparent' }}
                onMouseDown={e => startResize(e, i)} onClick={e => e.stopPropagation()} />
            </div>
          ))}
        </div>
        <DragSelectContainer items={sortedFiles} selectedIds={selectedIds} setSelectedIds={setSelectedIds}>
          {sortedFiles.map((file, idx) => (
            <div
              key={file.id}
              data-row data-id={file.id}
              className={`flex items-center cursor-pointer border-b border-gray-100 ${selectedIds.includes(file.id) ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
              onClick={e => {
                handleClick(e, file.id, idx)
                if (file.content_type?.includes('image')) setPreview({ url: file.url, filename: file.filename })
                else setPreview(null)
              }}
            >
              {columns.map(col => (
                <div key={col.key} className="px-3 py-2 overflow-hidden text-ellipsis whitespace-nowrap" style={{ width: col.width, minWidth: col.width }}>
                  {col.key === 'name' && <span className="flex items-center gap-2"><span>{getIcon(file.content_type)}</span><span>{file.filename}</span></span>}
                  {col.key === 'date' && <span className="text-gray-500">{file.uploaded_at?.slice(0, 19).replace('T', ' ')}</span>}
                  {col.key === 'type' && <span className="text-gray-500">{getTypeName(file.content_type)}</span>}
                </div>
              ))}
            </div>
          ))}
        </DragSelectContainer>
      </div>
      {preview && (
        <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-600">{preview.filename}</span>
            <button className="text-gray-400 hover:text-gray-600" onClick={() => setPreview(null)}>✕ 닫기</button>
          </div>
          <div className="flex justify-center">
            <img src={preview.url} alt={preview.filename} className="max-w-full max-h-96 object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  const [token, setToken] = useState('')
  const [page, setPage] = useState('login')

  return (
    <div>
      {token ? (
        <Dashboard token={token} onLogout={() => setToken('')} />
      ) : page === 'register' ? (
        <Register onBack={() => setPage('login')} />
      ) : (
        <Login onLogin={setToken} onRegister={() => setPage('register')} />
      )}
    </div>
  )
}

export default App