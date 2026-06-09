import { useState } from 'react'
import { loadTeacherData, saveTeacherData } from '../teacher-store'
import TeacherSetup from './TeacherSetup'
import TeacherView from './TeacherView'

export default function TeacherPanel() {
  const [data, setData] = useState(loadTeacherData)

  function handleSetup(initialData) {
    saveTeacherData(initialData)
    setData(initialData)
  }

  if (!data.initialized) {
    return <TeacherSetup onSetup={handleSetup} />
  }

  return <TeacherView data={data} onDataChange={setData} />
}
