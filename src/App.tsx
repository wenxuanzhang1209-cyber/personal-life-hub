import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, FormEvent, ReactNode } from 'react'
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  CheckSquare2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleDot,
  CircleUserRound,
  Clock3,
  Command,
  Download,
  Dumbbell,
  FileSearch,
  FileText,
  FileUp,
  FolderKanban,
  HeartPulse,
  Home,
  Inbox,
  Lightbulb,
  ListChecks,
  LockKeyhole,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  Paperclip,
  Plane,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  Shield,
  ShieldCheck,
  Sparkles,
  Tag,
  Upload,
  UploadCloud,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Space = 'all' | 'work' | 'life' | 'private'
type WorkView = 'today' | 'calendar' | 'tasks' | 'issues' | 'templates' | 'inbox' | 'library' | 'projects' | 'review'
type TaskStatus = 'inbox' | 'next' | 'doing' | 'waiting' | 'done'
type Priority = 'P0' | 'P1' | 'P2'
type FileType = '会议纪要' | '供应商简报' | '个人记录' | '方案/合同' | '生活文件' | '其他'

interface Task {
  id: string
  title: string
  space: Exclude<Space, 'all'>
  project: string
  due?: string
  time?: string
  duration?: number
  priority: Priority
  status: TaskStatus
  waitingOn?: string
  source?: string
  note?: string
}

interface EventItem {
  id: string
  title: string
  space: Exclude<Space, 'all'>
  time: string
  end: string
  kind: 'meeting' | 'focus' | 'life'
  project?: string
}

interface Project {
  id: string
  name: string
  space: Exclude<Space, 'all'>
  type: string
  status: '推进中' | '等待外部' | '有风险' | '规划中' | '完成'
  health: 'steady' | 'watch' | 'risk'
  progress: number
  next: string
  updated: string
  description: string
}

interface FileRecord {
  id: string
  name: string
  type: FileType
  space: Exclude<Space, 'all'>
  source: string
  project?: string
  updated: string
  size: string
  status: '待确认' | '已分析' | '已关联'
  summary: string
  facts: string[]
  suggestions: string[]
}

interface Idea {
  id: string
  title: string
  detail: string
  space: Exclude<Space, 'all'>
  status: '未整理' | '值得研究' | '已关联'
  created: string
}

interface Issue {
  id: string
  title: string
  space: Exclude<Space, 'all'>
  project: string
  severity: '高' | '中' | '低'
  status: '开放' | '等待外部' | '已解决'
  next: string
  owner: string
  updated: string
  source?: string
}

interface Decision {
  id: string
  title: string
  result: string
  space: Exclude<Space, 'all'>
  project: string
  status: '待确认' | '已决定'
  date: string
  evidence: string
}

interface Template {
  id: string
  title: string
  category: string
  description: string
  content: string
  space: Exclude<Space, 'all'>
  updated: string
  uses: number
}

interface AppData {
  tasks: Task[]
  events: EventItem[]
  projects: Project[]
  files: FileRecord[]
  ideas: Idea[]
  issues: Issue[]
  decisions: Decision[]
  templates: Template[]
}

const STORAGE_KEY = 'north-personal-os-v1'

const navItems: Array<{ id: WorkView; label: string; icon: LucideIcon }> = [
  { id: 'today', label: '今日', icon: BarChart3 },
  { id: 'calendar', label: '日程', icon: CalendarDays },
  { id: 'tasks', label: '任务', icon: CheckSquare2 },
  { id: 'issues', label: '问题', icon: CircleAlert },
  { id: 'templates', label: '模板', icon: BookOpen },
  { id: 'inbox', label: '收件箱', icon: Inbox },
  { id: 'library', label: '资料库', icon: FileText },
  { id: 'projects', label: '项目', icon: FolderKanban },
  { id: 'review', label: '复盘', icon: RotateCcw },
]

const spaceMeta: Record<Space, { label: string; short: string; icon: LucideIcon; color: string }> = {
  all: { label: '全部', short: 'All', icon: CircleDot, color: 'neutral' },
  work: { label: '工作', short: 'Work', icon: Briefcase, color: 'blue' },
  life: { label: '生活', short: 'Life', icon: HeartPulse, color: 'sage' },
  private: { label: '私密', short: 'Private', icon: LockKeyhole, color: 'wine' },
}

const projectIcons: Record<string, LucideIcon> = {
  school: Building2,
  robot: Activity,
  supplier: Sparkles,
  wormhole: ShieldCheck,
  marketing: ArrowUpRight,
  life: HeartPulse,
}

const pad = (value: number) => String(value).padStart(2, '0')
const isoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const todayIso = isoDate(new Date())
const addDays = (offset: number) => {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return isoDate(date)
}
const dateLabel = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())
const displayDate = (value?: string) => value ? new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`)) : '未安排'

function seedData(): AppData {
  return {
    tasks: [
      { id: 't1', title: '核验 8 月 18 日后学校拜访名单', space: 'work', project: '学校与机构渠道', due: todayIso, time: '09:30', duration: 45, priority: 'P0', status: 'next', source: '2026.08.10 渠道拓展与市场宣发策略对齐会', note: '先完成展演 14 校与机器狗 11 校去重。' },
      { id: 't2', title: '确认机器狗试点包的验收边界', space: 'work', project: '机器狗课程、试点与赛事', due: todayIso, time: '11:00', duration: 60, priority: 'P0', status: 'doing', source: '闵行 / 尚德 / 静安三场回访纪要' },
      { id: 't3', title: '整理灵漾 POC 待验证问题', space: 'work', project: '灵漾供应商尽调与 POC', due: addDays(1), time: '14:00', duration: 50, priority: 'P1', status: 'waiting', waitingOn: '供应商补充安全与数据说明', source: '2026.08.05 灵漾平台介绍会议纪要' },
      { id: 't4', title: '确认第一课素材授权与发布事实门', space: 'work', project: '第一课、音综与宣发', due: addDays(2), time: '16:00', duration: 45, priority: 'P0', status: 'next', source: '个人工作计划及宣发' },
      { id: 't5', title: '运动 40 分钟，安排本周恢复节奏', space: 'life', project: '健康与运动', due: todayIso, time: '18:30', duration: 40, priority: 'P1', status: 'next' },
      { id: 't6', title: '整理本月报销与账单凭证', space: 'life', project: '消费与账单', due: addDays(2), duration: 30, priority: 'P2', status: 'inbox' },
      { id: 't7', title: '写下今天的三条复盘记录', space: 'private', project: '个人记录', due: todayIso, time: '21:30', duration: 15, priority: 'P2', status: 'next' },
    ],
    events: [
      { id: 'e1', title: '今日工作规划', space: 'work', time: '09:00', end: '09:20', kind: 'focus', project: '个人统筹' },
      { id: 'e2', title: '学校渠道名单梳理', space: 'work', time: '09:30', end: '10:15', kind: 'focus', project: '学校与机构渠道' },
      { id: 'e3', title: '机器狗试点包确认', space: 'work', time: '11:00', end: '12:00', kind: 'meeting', project: '机器狗课程、试点与赛事' },
      { id: 'e4', title: '深度工作时间', space: 'work', time: '14:00', end: '15:30', kind: 'focus', project: '灵漾供应商尽调与 POC' },
      { id: 'e5', title: '运动与恢复', space: 'life', time: '18:30', end: '19:10', kind: 'life', project: '健康与运动' },
      { id: 'e6', title: '个人记录', space: 'private', time: '21:30', end: '21:45', kind: 'life', project: '个人记录' },
    ],
    projects: [
      { id: 'p1', name: '学校与机构渠道', space: 'work', type: '学校渠道', status: '推进中', health: 'watch', progress: 42, next: '完成 14+11 触点去重与分级', updated: '今天 08:40', description: '把展演、机器狗和其他学校触点沉淀为可跟进的渠道漏斗。' },
      { id: 'p2', name: '机器狗课程、试点与赛事', space: 'work', type: '产品 / 课程', status: '推进中', health: 'watch', progress: 36, next: '确定三类试点的共用课程骨架', updated: '昨天 17:20', description: '课程、设备、赛事和交付标准需要在小范围内先验证。' },
      { id: 'p3', name: '灵漾供应商尽调与 POC', space: 'work', type: '供应商 POC', status: '等待外部', health: 'risk', progress: 24, next: '补齐安全、数据、迁移与 SLA 证据', updated: '昨天 15:10', description: '分开记录供应商自述能力与已验证能力。' },
      { id: 'p4', name: '虫洞招投标', space: 'work', type: '招投标', status: '有风险', health: 'risk', progress: 18, next: '核对截止日期、文件清单与 RACI', updated: '8 月 14 日', description: '招投标与园区运营拆开管理，但保留关联。' },
      { id: 'p5', name: '第一课、音综与宣发', space: 'work', type: '宣发活动', status: '规划中', health: 'steady', progress: 51, next: '先过课程、学校、授权与事实审查', updated: '8 月 13 日', description: '不让传播节点跑在产品事实之前。' },
      { id: 'p6', name: '健康与运动', space: 'life', type: '生活领域', status: '推进中', health: 'steady', progress: 64, next: '完成今天运动，安排恢复日', updated: '今天 07:50', description: '以计划—完成—恢复的节奏保持状态。' },
    ],
    files: [
      { id: 'f1', name: '2026.08.10 渠道拓展与市场宣发策略对齐会.docx', type: '会议纪要', space: 'work', source: '会议纪要 / 根目录', project: '学校与机构渠道', updated: '今天 08:40', size: '86 KB', status: '已关联', summary: '围绕学校触点、第一课、校长沙龙与平台入口的渠道对齐记录。', facts: ['8 月 18 日后进入学校实地拜访窗口。', '展演 14 校与机器狗 11 校可能存在重复，尚待去重。'], suggestions: ['建立学校渠道漏斗', '确认第一课课程与授权事实'] },
      { id: 'f2', name: '2026.08.05 灵漾 ai 人工智能教育平台介绍会议纪要.docx', type: '供应商简报', space: 'work', source: '会议纪要 / 根目录', project: '灵漾供应商尽调与 POC', updated: '昨天 15:10', size: '74 KB', status: '待确认', summary: '供应商平台能力介绍与合作需求讨论，目前仍处于尽调 / POC 阶段。', facts: ['平台能力来自供应商介绍，尚无完整独立验收证据。', '数据、IP、SLA 和迁移边界需要书面确认。'], suggestions: ['创建 POC 验收清单', '向供应商追问数据隔离与退出机制'] },
      { id: 'f3', name: '静安少年宫-科技教育实施指南修改报审版.docx', type: '方案/合同', space: 'work', source: '机器狗回访', project: '机器狗课程、试点与赛事', updated: '8 月 13 日', size: '118 KB', status: '待确认', summary: '课程归口和项目映射的参考稿，文件名明确为修改报审版。', facts: ['当前文件不是最终政策文件。', '课程需要真实映射绿色校园巡检与智慧建造场景。'], suggestions: ['向归口单位确认正式版本', '建立静安单校试点任务'] },
      { id: 'f4', name: '个人工作日报 大会结束 8.1-.docx', type: '个人记录', space: 'work', source: '个人', project: '个人统筹', updated: '8 月 16 日', size: '241 KB', status: '已分析', summary: '包含个人推进、学校需求、工作判断和创意池的连续记录。', facts: ['记录了多个并行工作流与走访安排。', '部分计划和状态需要回填确认。'], suggestions: ['生成每日三件结果', '把创意池与 P0 工作流分离'] },
      { id: 'f5', name: '本月账单与报销凭证', type: '生活文件', space: 'life', source: '本地授权目录 / 待整理', project: '消费与账单', updated: '今天 07:32', size: '12 张图片', status: '待确认', summary: '生活空间中的凭证集合，建议先按账单、报销和待支付分组。', facts: ['需要人工确认是否包含工作报销材料。'], suggestions: ['建立报销待办', '设置本月账单复核时间'] },
    ],
    ideas: [
      { id: 'i1', title: '把个人工作台做成“证据到行动”的系统', detail: '文件不是终点，最终要形成可安排、可完成、可复盘的结果。', space: 'work', status: '已关联', created: '今天' },
      { id: 'i2', title: '每周留一段不被会议占用的生活时间', detail: '把恢复和长期生活安排当作真实日程，而不是剩余时间。', space: 'life', status: '值得研究', created: '昨天' },
    ],
    issues: [
      { id: 'q1', title: '灵漾平台的数据隔离、迁移与退出边界尚未书面确认', space: 'work', project: '灵漾供应商尽调与 POC', severity: '高', status: '等待外部', next: '向供应商发出四项书面追问，并设回收日期', owner: '供应商', updated: '昨天 15:10', source: '平台介绍会议纪要' },
      { id: 'q2', title: '机器狗课程与静安归口场景仍需完成真实映射', space: 'work', project: '机器狗课程、试点与赛事', severity: '高', status: '开放', next: '用绿色校园巡检 / 智慧建造重写试点说明', owner: '我', updated: '8 月 13 日', source: '静安实施指南修改报审版' },
      { id: 'q3', title: '学校渠道名单存在重复触点，拜访优先级未统一', space: 'work', project: '学校与机构渠道', severity: '中', status: '开放', next: '完成 14 校与 11 校去重、分级和下一次触达', owner: '我', updated: '今天 08:40', source: '渠道拓展对齐会' },
      { id: 'q4', title: '生活账单、报销和待支付事项需要分开管理', space: 'life', project: '消费与账单', severity: '低', status: '开放', next: '先按用途和截止日整理本月凭证', owner: '我', updated: '今天 07:32' },
    ],
    decisions: [
      { id: 'd1', title: '付费方与商业化路径暂不视为已定案', result: '先把 C 端订阅、区教委采购和学校项目拆成独立假设，分别验证。', space: 'work', project: '学校与机构渠道', status: '待确认', date: '8 月 10 日', evidence: '多份会议记录的口径尚未收敛' },
      { id: 'd2', title: '机器狗项目先做场景真实、范围可验收的试点', result: '不以“课 + 赛 + 活动”作为已确认共识，先锁定课程骨架、设备与验收边界。', space: 'work', project: '机器狗课程、试点与赛事', status: '已决定', date: '8 月 13 日', evidence: '三场回访与静安指南修订稿' },
      { id: 'd3', title: '把恢复时间当作正式生活安排', result: '每周至少保留一段不被工作挤占的运动与恢复时段。', space: 'life', project: '健康与运动', status: '已决定', date: '本周', evidence: '个人生活节奏复盘' },
    ],
    templates: [
      { id: 'tpl1', title: '会议纪要 → 决策与行动', category: '会议', description: '把原始讨论拆成事实、分歧、决定、下一步和负责人。', content: '会议主题：\n日期 / 参与人：\n已确认事实：\n未决问题：\n已做决定：\n下一步（负责人 / 截止日 / 证据）：\n', space: 'work', updated: '今天', uses: 12 },
      { id: 'tpl2', title: '供应商尽调与 POC 清单', category: '供应商', description: '按能力证据、数据/IP、安全、SLA、迁移和退出机制逐项核验。', content: '供应商：\n能力自述：\n已验证证据：\n数据与 IP：\n安全与权限：\nSLA 与售后：\n迁移 / 退出：\nPOC 验收门槛：\n', space: 'work', updated: '昨天', uses: 6 },
      { id: 'tpl3', title: '周复盘四问', category: '复盘', description: '用最少问题看清结果、等待、风险与下一周容量。', content: '本周最有价值的三个结果：\n持续等待的事项：\n没有唯一下一步的项目：\n下周主动删掉什么：\n', space: 'private', updated: '本周', uses: 9 },
      { id: 'tpl4', title: '生活安排卡', category: '生活', description: '把健康、家庭、账单和恢复变成有时间、有证据的安排。', content: '生活事项：\n为什么重要：\n安排时间：\n完成证据：\n需要谁配合：\n下一次复查：\n', space: 'life', updated: '昨天', uses: 4 },
    ],
  }
}

function loadData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const defaults = seedData()
    if (!stored) return defaults
    const parsed = JSON.parse(stored) as Partial<AppData>
    return {
      ...defaults,
      ...parsed,
      tasks: parsed.tasks ?? defaults.tasks,
      events: parsed.events ?? defaults.events,
      projects: parsed.projects ?? defaults.projects,
      files: parsed.files ?? defaults.files,
      ideas: parsed.ideas ?? defaults.ideas,
      issues: parsed.issues ?? defaults.issues,
      decisions: parsed.decisions ?? defaults.decisions,
      templates: parsed.templates ?? defaults.templates,
    }
  } catch {
    return seedData()
  }
}

function App() {
  const [data, setData] = useState<AppData>(() => loadData())
  const [space, setSpace] = useState<Space>('all')
  const [view, setView] = useState<WorkView>('today')
  const [mobileNav, setMobileNav] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerKind, setComposerKind] = useState<'task' | 'idea' | 'issue' | 'project'>('task')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftSpace, setDraftSpace] = useState<Exclude<Space, 'all'>>('work')
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null)
  const [dragging, setDragging] = useState(false)
  const [toast, setToast] = useState('')
  const uploadRef = useRef<HTMLInputElement>(null)
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setComposerOpen(false)
        setSelectedFile(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const visibleTasks = useMemo(() => data.tasks.filter((task) => space === 'all' || task.space === space), [data.tasks, space])
  const visibleProjects = useMemo(() => data.projects.filter((project) => space === 'all' || project.space === space), [data.projects, space])
  const visibleFiles = useMemo(() => data.files.filter((file) => space === 'all' || file.space === space), [data.files, space])
  const visibleIssues = useMemo(() => data.issues.filter((issue) => space === 'all' || issue.space === space), [data.issues, space])
  const visibleDecisions = useMemo(() => data.decisions.filter((decision) => space === 'all' || decision.space === space), [data.decisions, space])
  const visibleTemplates = useMemo(() => data.templates.filter((template) => space === 'all' || template.space === space), [data.templates, space])
  const pendingFiles = visibleFiles.filter((file) => file.status === '待确认')
  const overdueCount = visibleTasks.filter((task) => task.due && task.due < todayIso && task.status !== 'done').length

  const spaceLabel = spaceMeta[space].label
  const notify = (message: string) => setToast(message)

  const updateTask = (id: string, patch: Partial<Task>) => {
    setData((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === id ? { ...task, ...patch } : task) }))
  }

  const updateIssue = (id: string, patch: Partial<Issue>) => {
    setData((current) => ({ ...current, issues: current.issues.map((issue) => issue.id === id ? { ...issue, ...patch, updated: '刚刚' } : issue) }))
  }

  const toggleTask = (id: string) => {
    const task = data.tasks.find((item) => item.id === id)
    if (!task) return
    updateTask(id, { status: task.status === 'done' ? 'next' : 'done' })
    notify(task.status === 'done' ? '任务已重新打开' : '已完成，结果会留在项目时间线中')
  }

  const createTask = (title: string, taskSpace: Exclude<Space, 'all'> = draftSpace) => {
    const trimmed = title.trim()
    if (!trimmed) return
    const task: Task = {
      id: `task-${Date.now()}`,
      title: trimmed,
      space: taskSpace,
      project: taskSpace === 'work' ? '个人统筹' : taskSpace === 'life' ? '日常与习惯' : '个人记录',
      due: todayIso,
      priority: 'P1',
      status: 'next',
      source: '手动创建',
    }
    setData((current) => ({ ...current, tasks: [task, ...current.tasks] }))
    notify('任务已加入今日工作台')
  }

  const handleQuickCapture = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    createTask(query, space === 'all' ? 'work' : space)
    setQuery('')
  }

  const handleComposer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draftTitle.trim()) return
    if (composerKind === 'task') createTask(draftTitle, draftSpace)
    else if (composerKind === 'issue') {
      const issue: Issue = { id: `issue-${Date.now()}`, title: draftTitle.trim(), space: draftSpace, project: draftSpace === 'work' ? '个人统筹' : draftSpace === 'life' ? '日常与习惯' : '个人记录', severity: '中', status: '开放', next: '补充下一步和验证证据', owner: '我', updated: '刚刚', source: '手动创建' }
      setData((current) => ({ ...current, issues: [issue, ...current.issues] }))
      notify('问题已加入问题库')
    } else if (composerKind === 'project') {
      const project: Project = { id: `project-${Date.now()}`, name: draftTitle.trim(), space: draftSpace, type: draftSpace === 'work' ? '工作项目' : draftSpace === 'life' ? '生活领域' : '个人记录', status: '规划中', health: 'steady', progress: 0, next: '定义项目的唯一下一步', updated: '刚刚', description: '刚刚创建，等待补充目标、边界和完成标准。' }
      setData((current) => ({ ...current, projects: [project, ...current.projects] }))
      notify('项目容器已创建')
    } else {
      const idea: Idea = { id: `idea-${Date.now()}`, title: draftTitle.trim(), detail: '刚刚捕获，等待进一步整理。', space: draftSpace, status: '未整理', created: '刚刚' }
      setData((current) => ({ ...current, ideas: [idea, ...current.ideas] }))
      notify('灵感已保存到灵感库')
    }
    setDraftTitle('')
    setComposerOpen(false)
  }

  const addFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList)
    if (!files.length) return
    const records: FileRecord[] = files.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      type: guessFileType(file.name),
      space: space === 'all' ? 'work' : space,
      source: '拖入收件箱',
      updated: '刚刚',
      size: formatBytes(file.size),
      status: '待确认',
      summary: '文件已保存到收件箱，等待内容解析与人工确认。',
      facts: ['原件已保留', '文件类型和所属空间仍可修改'],
      suggestions: ['确认所属项目', '确认是否需要创建任务或问题'],
    }))
    setData((current) => ({ ...current, files: [...records, ...current.files] }))
    notify(`${records.length} 个文件已进入收件箱`)
    setView('inbox')
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files)
    event.target.value = ''
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files)
  }

  const confirmFile = (id: string) => {
    setData((current) => ({ ...current, files: current.files.map((file) => file.id === id ? { ...file, status: '已关联', updated: '刚刚' } : file) }))
    notify('文件已确认并关联到资料库')
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `north-backup-${todayIso}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    notify('已导出本地备份')
  }

  const importData = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppData
        if (!parsed.tasks || !parsed.projects || !parsed.files) throw new Error('invalid')
        setData(parsed)
        notify('备份已导入，当前数据已更新')
      } catch {
        notify('导入失败：这不是有效的 NORTH 备份文件')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const changeView = (next: WorkView) => {
    setView(next)
    setMobileNav(false)
  }

  return (
    <div className={`app-shell space-${space}`}>
      <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark">N</div>
          <div>
            <div className="brand-name">NORTH</div>
            <div className="brand-caption">个人生活与工作中枢</div>
          </div>
          <button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="关闭导航"><X size={18} /></button>
        </div>

        <div className="space-switcher" aria-label="空间切换">
          <div className="eyebrow">SPACE</div>
          {(Object.keys(spaceMeta) as Space[]).map((key) => {
            const meta = spaceMeta[key]
            const Icon = meta.icon
            return <button key={key} className={`space-pill ${space === key ? 'active' : ''} tone-${meta.color}`} onClick={() => setSpace(key)}>
              <Icon size={15} /> <span>{meta.label}</span>{key === 'private' && <LockKeyhole size={12} className="space-lock" />}
            </button>
          })}
        </div>

        <nav className="main-nav">
          <div className="eyebrow nav-heading">FOCUS</div>
          {navItems.map((item) => {
            const Icon = item.icon
            const count = item.id === 'inbox' ? pendingFiles.length : item.id === 'tasks' ? overdueCount : 0
            return <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => changeView(item.id)}>
              <Icon size={18} strokeWidth={view === item.id ? 2.2 : 1.8} /><span>{item.label}</span>{count > 0 && <span className="nav-count">{count}</span>}
            </button>
          })}
        </nav>

        <div className="sidebar-section">
          <div className="eyebrow nav-heading">COLLECTIONS</div>
          <button className="nav-item subtle" onClick={() => { setSpace('work'); changeView('projects') }}><Briefcase size={17} /><span>工作项目</span><ChevronRight size={14} className="nav-chevron" /></button>
          <button className="nav-item subtle" onClick={() => { setSpace('life'); changeView('today') }}><HeartPulse size={17} /><span>生活领域</span><ChevronRight size={14} className="nav-chevron" /></button>
          <button className="nav-item subtle" onClick={() => { setSpace('all'); changeView('issues') }}><CircleAlert size={17} /><span>问题与决策</span><ChevronRight size={14} className="nav-chevron" /></button>
          <button className="nav-item subtle" onClick={() => { setSpace('all'); changeView('templates') }}><BookOpen size={17} /><span>模板与规范</span><ChevronRight size={14} className="nav-chevron" /></button>
          <button className="nav-item subtle" onClick={() => { setSpace('work'); changeView('library') }}><FileSearch size={17} /><span>待确认资料</span>{pendingFiles.length > 0 && <span className="nav-count light">{pendingFiles.length}</span>}</button>
        </div>

        <div className="sidebar-bottom">
          <div className="sync-row"><span className="sync-dot" /> <span>本地数据已保存</span><Shield size={14} /></div>
          <div className="sidebar-actions">
            <button className="small-action" onClick={exportData}><ArrowDownToLine size={14} /> 导出</button>
            <button className="small-action" onClick={() => importRef.current?.click()}><Upload size={14} /> 导入</button>
          </div>
          <input ref={importRef} type="file" accept="application/json" hidden onChange={importData} />
          <button className="account-row"><div className="avatar">W</div><div><strong>我的中枢</strong><span>本地优先账户</span></div><Settings2 size={16} /></button>
        </div>
      </aside>

      <main className="main-content" onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}>
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="打开导航"><Menu size={19} /></button>
          <div className="crumb"><span>{spaceLabel}</span><ChevronRight size={14} /><strong>{navItems.find((item) => item.id === view)?.label}</strong></div>
          <div className="top-actions">
            <button className="sync-status" onClick={() => notify('本地文件助手接口预留中，授权目录将在第二阶段接入')}><span className="sync-dot" /> <span className="top-sync-text">同步正常</span></button>
            <button className="icon-button" onClick={() => setSearchOpen(true)} aria-label="搜索"><Search size={18} /></button>
            <button className="primary-button compact" onClick={() => { setComposerKind('task'); setComposerOpen(true) }}><Plus size={16} /> 新建</button>
          </div>
        </header>

        <div className="page-wrap">
          {view === 'today' && <TodayPage data={data} space={space} tasks={visibleTasks} events={data.events.filter((event) => space === 'all' || event.space === space)} projects={visibleProjects} files={visibleFiles} onToggle={toggleTask} onUpdateTask={updateTask} onOpenFile={setSelectedFile} onOpenCalendar={() => changeView('calendar')} onQuickIdea={() => { setComposerKind('idea'); setComposerOpen(true) }} onUpload={() => uploadRef.current?.click()} query={query} setQuery={setQuery} onQuickCapture={handleQuickCapture} />}
          {view === 'calendar' && <CalendarPage events={data.events.filter((event) => space === 'all' || event.space === space)} tasks={visibleTasks} onToggle={toggleTask} onCreateTask={() => { setComposerKind('task'); setComposerOpen(true) }} />}
          {view === 'tasks' && <TasksPage tasks={visibleTasks} onToggle={toggleTask} onUpdateTask={updateTask} onCreateTask={() => { setComposerKind('task'); setComposerOpen(true) }} space={space} />}
          {view === 'issues' && <IssuesPage issues={visibleIssues} decisions={visibleDecisions} onUpdateIssue={updateIssue} onCreateIssue={() => { setComposerKind('issue'); setComposerOpen(true) }} />}
          {view === 'templates' && <TemplatesPage templates={visibleTemplates} onNotify={notify} />}
          {view === 'inbox' && <InboxPage files={visibleFiles} dragging={dragging} onUpload={() => uploadRef.current?.click()} onOpenFile={setSelectedFile} onConfirm={confirmFile} onDrop={handleDrop} />}
          {view === 'library' && <LibraryPage files={visibleFiles} ideas={data.ideas.filter((idea) => space === 'all' || idea.space === space)} onOpenFile={setSelectedFile} onUpload={() => uploadRef.current?.click()} onQuickIdea={() => { setComposerKind('idea'); setComposerOpen(true) }} />}
          {view === 'projects' && <ProjectsPage projects={visibleProjects} tasks={visibleTasks} onCreateProject={() => { setComposerKind('project'); setComposerOpen(true) }} onOpenIssues={() => changeView('issues')} />}
          {view === 'review' && <ReviewPage data={data} space={space} />}
        </div>
        <input ref={uploadRef} type="file" multiple accept=".docx,.pdf,.pptx,.xlsx,.png,.jpg,.jpeg,.md,.txt" hidden onChange={handleFileChange} />
      </main>

      {dragging && <div className="drop-overlay"><div className="drop-card"><FileUp size={28} /><strong>释放文件，加入收件箱</strong><span>原件会被保留，分析结果需要你确认后才会进入正式台账</span></div></div>}
      {selectedFile && <FileDrawer file={selectedFile} onClose={() => setSelectedFile(null)} onConfirm={() => { confirmFile(selectedFile.id); setSelectedFile({ ...selectedFile, status: '已关联', updated: '刚刚' }) }} onAddTask={(title) => { createTask(title, selectedFile.space); notify('分析建议已转成下一步') }} onNotify={notify} />}
      {composerOpen && <Composer kind={composerKind} title={draftTitle} space={draftSpace} setTitle={setDraftTitle} setSpace={setDraftSpace} onClose={() => setComposerOpen(false)} onSubmit={handleComposer} />}
      {searchOpen && <SearchOverlay data={data} onClose={() => setSearchOpen(false)} onOpenFile={(file) => { setSelectedFile(file); setSearchOpen(false) }} onSelectTask={(task) => { changeView('tasks'); setSearchOpen(false); notify(`已定位任务：${task.title}`) }} onSelectIssue={(issue) => { changeView('issues'); setSearchOpen(false); notify(`已定位问题：${issue.title}`) }} onSelectTemplate={(template) => { changeView('templates'); setSearchOpen(false); notify(`已定位模板：${template.title}`) }} />}
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </div>
  )
}

function TodayPage({ data, space, tasks, events, projects, files, onToggle, onUpdateTask, onOpenFile, onOpenCalendar, onQuickIdea, onUpload, query, setQuery, onQuickCapture }: {
  data: AppData; space: Space; tasks: Task[]; events: EventItem[]; projects: Project[]; files: FileRecord[]; onToggle: (id: string) => void; onUpdateTask: (id: string, patch: Partial<Task>) => void; onOpenFile: (file: FileRecord) => void; onOpenCalendar: () => void; onQuickIdea: () => void; onUpload: () => void; query: string; setQuery: (value: string) => void; onQuickCapture: (event: FormEvent<HTMLFormElement>) => void
}) {
  const activeTasks = tasks.filter((task) => task.status !== 'done')
  const resultTasks = activeTasks.filter((task) => task.due === todayIso).slice(0, 3)
  const waiting = activeTasks.filter((task) => task.status === 'waiting')
  const late = activeTasks.filter((task) => task.due && task.due < todayIso)
  const todayEvents = events.sort((a, b) => a.time.localeCompare(b.time))
  const attentionProjects = projects.filter((project) => project.health !== 'steady').slice(0, 3)
  const recentFiles = files.slice(0, 3)
  const workCount = activeTasks.filter((task) => task.space === 'work').length
  const lifeCount = activeTasks.filter((task) => task.space === 'life').length

  return <>
    <section className="welcome-row">
      <div>
        <div className="eyebrow">{space === 'all' ? 'TODAY · ALL SPACES' : `${spaceMeta[space].short.toUpperCase()} · TODAY`}</div>
        <h1>今天，先把重要的事放到眼前。</h1>
        <p className="lead">{dateLabel} · {workCount} 个工作行动 · {lifeCount} 个生活行动 · {waiting.length} 个等待外部</p>
      </div>
      <div className="date-stamp"><span>{new Date().getFullYear()}</span><strong>{new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(new Date()).replace('/', '·')}</strong></div>
    </section>

    <form className="capture-bar" onSubmit={onQuickCapture}>
      <Sparkles size={18} className="capture-icon" />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="快速记录一件事，按 Enter 变成今天的下一步……" />
      <button type="button" className="capture-action" onClick={onUpload}><Paperclip size={16} /> 文件</button>
      <button type="button" className="capture-action" onClick={onQuickIdea}><Lightbulb size={16} /> 灵感</button>
      <button type="submit" className="capture-submit" disabled={!query.trim()}>记录</button>
    </form>

    <div className="today-layout">
      <div className="today-main">
        <section className="section-block">
          <div className="section-header"><div><div className="eyebrow">FOCUS OUTCOMES</div><h2>今天的三个结果</h2></div><span className="section-note">只放今天真正要推动的结果</span></div>
          <div className="outcome-list">
            {(resultTasks.length ? resultTasks : activeTasks.slice(0, 3)).map((task, index) => <OutcomeRow key={task.id} task={task} index={index} onToggle={onToggle} />)}
            {!resultTasks.length && <div className="empty-inline">今天还没有明确结果，从上方快速记录开始。</div>}
          </div>
        </section>

        <section className="section-block timeline-block">
          <div className="section-header"><div><div className="eyebrow">YOUR DAY</div><h2>统一时间线</h2></div><button className="text-button" onClick={onOpenCalendar}>打开完整日程 <ArrowUpRight size={14} /></button></div>
          <div className="timeline">
            {todayEvents.map((event) => <TimelineRow key={event.id} event={event} />)}
            {!todayEvents.length && <EmptyState icon={CalendarDays} title="今天还没有安排" description="把任务拖进日程，给重要的事一个真实的时间。" />}
          </div>
        </section>
      </div>

      <aside className="today-side">
        <section className="side-card attention-card">
          <div className="section-header compact-header"><div><div className="eyebrow">ATTENTION</div><h3>需要你看一眼</h3></div><CircleAlert size={17} /></div>
          <div className="attention-list">
            <AttentionItem icon={Clock3} tone="amber" label="等待外部" value={`${waiting.length} 个事项`} note={waiting[0]?.waitingOn || '等待回应'} />
            <AttentionItem icon={CircleAlert} tone="red" label="逾期" value={`${late.length} 个事项`} note={late[0]?.title || '今天没有逾期'} />
            <AttentionItem icon={Inbox} tone="blue" label="待确认资料" value={`${files.filter((file) => file.status === '待确认').length} 份`} note="分析建议还没有写入正式台账" />
          </div>
        </section>

        <section className="side-card">
          <div className="section-header compact-header"><div><div className="eyebrow">PROJECT PULSE</div><h3>项目脉搏</h3></div><button className="icon-button tiny"><MoreHorizontal size={16} /></button></div>
          <div className="project-pulse-list">
            {attentionProjects.map((project) => <ProjectPulse key={project.id} project={project} />)}
            {!attentionProjects.length && <div className="empty-inline">当前项目节奏平稳。</div>}
          </div>
        </section>

        <section className="side-card recent-card">
          <div className="section-header compact-header"><div><div className="eyebrow">RECENT FILES</div><h3>最近资料</h3></div><FileText size={16} /></div>
          {recentFiles.map((file) => <button className="mini-file" key={file.id} onClick={() => onOpenFile(file)}><span className={`file-type-dot ${file.type === '供应商简报' ? 'supplier' : file.type === '生活文件' ? 'life' : 'meeting'}`}><FileText size={14} /></span><span className="mini-file-copy"><strong>{file.name}</strong><small>{file.updated} · {file.status}</small></span><ChevronRight size={14} /></button>)}
          {!recentFiles.length && <EmptyState icon={FileText} title="还没有资料" description="拖入一份会议纪要或生活文件。" compact />}
        </section>
      </aside>
    </div>
  </>
}

function OutcomeRow({ task, index, onToggle }: { task: Task; index: number; onToggle: (id: string) => void }) {
  return <div className={`outcome-row ${task.status === 'done' ? 'completed' : ''}`}>
    <button className="check-control" onClick={() => onToggle(task.id)} aria-label={task.status === 'done' ? '重新打开任务' : '完成任务'}>{task.status === 'done' && <Check size={14} />}</button>
    <div className="outcome-index">0{index + 1}</div>
    <div className="outcome-copy"><strong>{task.title}</strong><span>{task.project} {task.time && `· ${task.time}`} {task.duration && `· ${task.duration} 分钟`}</span></div>
    <span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
    <button className="icon-button tiny"><MoreHorizontal size={16} /></button>
  </div>
}

function TimelineRow({ event }: { event: EventItem }) {
  const Icon = event.space === 'work' ? Briefcase : event.space === 'life' ? HeartPulse : LockKeyhole
  return <div className={`timeline-row timeline-${event.space}`}>
    <div className="timeline-time"><strong>{event.time}</strong><span>{event.end}</span></div>
    <div className="timeline-line"><span /></div>
    <div className="timeline-event"><div className="timeline-event-top"><span className="space-tag"><Icon size={12} /> {spaceMeta[event.space].label}</span><span className="timeline-kind">{event.kind === 'meeting' ? '会议' : event.kind === 'focus' ? '专注' : '安排'}</span></div><strong>{event.title}</strong><span>{event.project}</span></div>
  </div>
}

function AttentionItem({ icon: Icon, tone, label, value, note }: { icon: LucideIcon; tone: string; label: string; value: string; note: string }) {
  return <div className="attention-item"><span className={`attention-icon tone-${tone}`}><Icon size={15} /></span><div><span>{label}</span><strong>{value}</strong><small title={note}>{note}</small></div></div>
}

function ProjectPulse({ project }: { project: Project }) {
  const Icon = projectIcons[project.id === 'p1' ? 'school' : project.id === 'p2' ? 'robot' : project.id === 'p3' ? 'supplier' : project.id === 'p4' ? 'wormhole' : 'marketing'] || FolderKanban
  return <div className="pulse-row"><span className={`pulse-icon health-${project.health}`}><Icon size={14} /></span><div className="pulse-copy"><strong>{project.name}</strong><span>{project.next}</span><div className="progress-track"><i style={{ width: `${project.progress}%` }} /></div></div><span className="pulse-percent">{project.progress}%</span></div>
}

function CalendarPage({ events, tasks, onToggle, onCreateTask }: { events: EventItem[]; tasks: Task[]; onToggle: (id: string) => void; onCreateTask: () => void }) {
  const hours = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21']
  return <>
    <PageHeader eyebrow="PLAN YOUR TIME" title="日程与待办" description="截止日期决定重要性，真实时间决定今天能否完成。" actions={<button className="primary-button" onClick={onCreateTask}><Plus size={16} /> 新建安排</button>} />
    <div className="calendar-toolbar"><div className="segmented"><button className="selected">日</button><button>周</button><button>月</button></div><span className="calendar-date">{dateLabel}</span><div className="calendar-actions"><button className="text-button">‹</button><button className="text-button">今天</button><button className="text-button">›</button></div></div>
    <div className="calendar-grid">
      <div className="calendar-hours">{hours.map((hour) => <span key={hour}>{hour}:00</span>)}</div>
      <div className="calendar-track">
        {hours.map((hour) => <div className="hour-line" key={hour}><span /></div>)}
        {events.map((event) => <div key={event.id} className={`calendar-event event-${event.space}`} style={{ top: `${(Number(event.time.slice(0, 2)) - 8) * 70 + (Number(event.time.slice(3)) / 60) * 70}px`, height: `${Math.max(44, (timeToMinutes(event.end) - timeToMinutes(event.time)) / 60 * 70)}px` }}><span>{event.time}—{event.end}</span><strong>{event.title}</strong><small>{event.project}</small></div>)}
        {tasks.filter((task) => task.due === todayIso && task.status !== 'done' && !task.time).slice(0, 3).map((task, index) => <div className="unscheduled-chip" style={{ top: `${50 + index * 38}px` }} key={task.id}><button className="check-control mini" onClick={() => onToggle(task.id)} /><span>{task.title}</span><small>未安排时间</small></div>)}
      </div>
    </div>
  </>
}

function TasksPage({ tasks, onToggle, onUpdateTask, onCreateTask, space }: { tasks: Task[]; onToggle: (id: string) => void; onUpdateTask: (id: string, patch: Partial<Task>) => void; onCreateTask: () => void; space: Space }) {
  const [filter, setFilter] = useState<'all' | TaskStatus | 'overdue'>('all')
  const filtered = tasks.filter((task) => filter === 'all' || filter === 'overdue' ? (filter === 'overdue' ? Boolean(task.due && task.due < todayIso && task.status !== 'done') : true) : task.status === filter)
  return <>
    <PageHeader eyebrow={`${spaceMeta[space].short.toUpperCase()} · EXECUTION`} title="任务库" description="每个任务都应该有下一步、时间和完成证据。" actions={<button className="primary-button" onClick={onCreateTask}><Plus size={16} /> 新建任务</button>} />
    <div className="filter-row"><div className="segmented wide">{[['all', '全部'], ['next', '下一步'], ['doing', '进行中'], ['waiting', '等待外部'], ['overdue', '逾期'], ['done', '已完成']].map(([value, label]) => <button key={value} className={filter === value ? 'selected' : ''} onClick={() => setFilter(value as typeof filter)}>{label}{value === 'overdue' && <span className="filter-count">{tasks.filter((task) => task.due && task.due < todayIso && task.status !== 'done').length}</span>}</button>)}</div><span className="list-meta">{filtered.length} 个任务</span></div>
    <div className="task-table card-surface"><div className="table-head"><span>行动</span><span>空间 / 项目</span><span>时间</span><span>状态</span><span /></div>{filtered.map((task) => <div className={`task-table-row ${task.status === 'done' ? 'done' : ''}`} key={task.id}><button className="check-control" onClick={() => onToggle(task.id)}>{task.status === 'done' && <Check size={14} />}</button><div className="task-table-main"><strong>{task.title}</strong><span>{task.source || '手动创建'}{task.waitingOn && ` · ${task.waitingOn}`}</span></div><div className="task-table-context"><span className={`space-tag ${task.space}`}><CircleDot size={11} />{spaceMeta[task.space].label}</span><small>{task.project}</small></div><div className="task-table-date"><strong>{displayDate(task.due)}</strong><span>{task.time || '未安排时段'}{task.duration ? ` · ${task.duration}m` : ''}</span></div><div className="status-select-wrap"><select value={task.status} onChange={(event) => onUpdateTask(task.id, { status: event.target.value as TaskStatus })}><option value="inbox">收件箱</option><option value="next">下一步</option><option value="doing">进行中</option><option value="waiting">等待外部</option><option value="done">完成</option></select></div><span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span></div>)}{!filtered.length && <EmptyState icon={CheckSquare2} title="这个视图还没有任务" description="把下一步写出来，系统才有机会帮你安排时间。" />}</div>
  </>
}

function InboxPage({ files, dragging, onUpload, onOpenFile, onConfirm, onDrop }: { files: FileRecord[]; dragging: boolean; onUpload: () => void; onOpenFile: (file: FileRecord) => void; onConfirm: (id: string) => void; onDrop: (event: DragEvent<HTMLDivElement>) => void }) {
  const pending = files.filter((file) => file.status === '待确认')
  return <>
    <PageHeader eyebrow="INBOX · CAPTURE FIRST" title="收件箱" description="任何新资料先被安全接住，再决定它要进入哪个项目、任务或生活领域。" actions={<button className="primary-button" onClick={onUpload}><UploadCloud size={16} /> 拖入或上传</button>} />
    <div className="agent-banner"><span className="agent-symbol"><Sparkles size={17} /></span><div><strong>本地文件助手 · 接口已预留</strong><span>未来可授权 Downloads、会议纪要等目录，代理会提出更新建议，但不会静默改动你的正式台账。</span></div><span className="coming-soon">第二阶段</span></div>
    <div className={`drop-zone ${dragging ? 'is-dragging' : ''}`} onClick={onUpload} onDragOver={(event) => event.preventDefault()} onDrop={onDrop}><UploadCloud size={26} /><strong>把会议纪要、供应商简报或生活文件拖到这里</strong><span>支持 DOCX、PDF、PPTX、XLSX、图片和文本 · 原件保留 · 解析结果需确认</span><button className="text-button">选择文件 <ArrowUpRight size={14} /></button></div>
    <div className="section-header list-section-header"><div><div className="eyebrow">NEEDS REVIEW</div><h2>待确认资料</h2></div><span className="section-note">{pending.length} 份文件等待你的判断</span></div>
    <div className="file-list card-surface">{pending.map((file) => <FileListRow key={file.id} file={file} onOpen={() => onOpenFile(file)} onConfirm={() => onConfirm(file.id)} />)}{!pending.length && <EmptyState icon={Inbox} title="收件箱是空的" description="今天的资料都已归档或确认。" />}</div>
  </>
}

function LibraryPage({ files, ideas, onOpenFile, onUpload, onQuickIdea }: { files: FileRecord[]; ideas: Idea[]; onOpenFile: (file: FileRecord) => void; onUpload: () => void; onQuickIdea: () => void }) {
  const [filter, setFilter] = useState<'全部' | FileType | '灵感'>('全部')
  const filtered = filter === '全部' ? files : filter === '灵感' ? [] : files.filter((file) => file.type === filter)
  return <>
    <PageHeader eyebrow="LIBRARY · EVIDENCE" title="资料库" description="文件是证据，项目、任务与决策是从证据延伸出来的行动。" actions={<button className="primary-button" onClick={onUpload}><FileUp size={16} /> 导入资料</button>} />
    <div className="library-toolbar"><div className="segmented wide">{(['全部', '会议纪要', '供应商简报', '个人记录', '方案/合同', '生活文件', '灵感'] as const).map((value) => <button key={value} className={filter === value ? 'selected' : ''} onClick={() => setFilter(value)}>{value}</button>)}</div><button className="filter-button"><Tag size={15} /> 筛选 <ChevronDown size={13} /></button></div>
    {filter === '灵感' ? <div className="idea-grid">{ideas.map((idea) => <div className="idea-card" key={idea.id}><div className="idea-top"><Lightbulb size={16} /><span>{idea.status}</span></div><h3>{idea.title}</h3><p>{idea.detail}</p><small>{idea.created} · {spaceMeta[idea.space].label}</small></div>)}<button className="idea-card add-idea" onClick={onQuickIdea}><Plus size={20} /><strong>捕获一个新灵感</strong><span>先记录，再决定归属</span></button></div> : <div className="file-grid">{filtered.map((file) => <FileCard file={file} key={file.id} onOpen={() => onOpenFile(file)} />)}{!filtered.length && <EmptyState icon={FileText} title="这个视图还没有资料" description="拖入文件后，它会先进入收件箱，再由你确认分类。" />}</div>}
  </>
}

function ProjectsPage({ projects, tasks, onCreateProject, onOpenIssues }: { projects: Project[]; tasks: Task[]; onCreateProject: () => void; onOpenIssues: () => void }) {
  return <>
    <PageHeader eyebrow="WORK + LIFE AREAS" title="项目与领域" description="工作项目、生活领域和个人目标都需要一个清晰的下一步。" actions={<button className="primary-button" onClick={onCreateProject}><Plus size={16} /> 新建容器</button>} />
    <div className="project-summary-strip"><span><strong>{projects.length}</strong> 个活动容器</span><span><strong>{projects.filter((project) => project.health === 'risk').length}</strong> 个需要关注</span><span><strong>{tasks.filter((task) => task.status === 'waiting').length}</strong> 个等待外部</span><button className="summary-link" onClick={onOpenIssues}>打开问题与决策 <ArrowUpRight size={14} /></button></div>
    <div className="project-grid">{projects.map((project) => <ProjectCard key={project.id} project={project} taskCount={tasks.filter((task) => task.project === project.name && task.status !== 'done').length} />)}</div>
  </>
}

function IssuesPage({ issues, decisions, onUpdateIssue, onCreateIssue }: { issues: Issue[]; decisions: Decision[]; onUpdateIssue: (id: string, patch: Partial<Issue>) => void; onCreateIssue: () => void }) {
  const openIssues = issues.filter((issue) => issue.status !== '已解决')
  const highIssues = openIssues.filter((issue) => issue.severity === '高')
  const waitingIssues = openIssues.filter((issue) => issue.status === '等待外部')
  return <>
    <PageHeader eyebrow="ISSUES + DECISIONS" title="问题与决策" description="把不确定性单独放出来，避免它们藏在会议纪要、聊天记录和脑内。" actions={<button className="primary-button" onClick={onCreateIssue}><Plus size={16} /> 新建问题</button>} />
    <div className="metric-strip"><div><span>未解决</span><strong>{openIssues.length}</strong></div><div><span>高风险</span><strong>{highIssues.length}</strong></div><div><span>等待外部</span><strong>{waitingIssues.length}</strong></div><div className="metric-note"><CircleAlert size={16} /><span>问题必须有下一步，决策必须有证据。</span></div></div>
    <div className="issues-layout">
      <section className="issue-panel card-surface"><div className="section-header compact-header"><div><div className="eyebrow">OPEN LOOP</div><h2>问题库</h2></div><span className="section-note">{issues.length} 条记录</span></div><div className="issue-list">{issues.map((issue) => <article className={`issue-row severity-${issue.severity}`} key={issue.id}><span className="issue-mark"><CircleAlert size={16} /></span><div className="issue-main"><div className="issue-title-line"><strong>{issue.title}</strong><span className={`severity-chip ${issue.severity}`}>{issue.severity}风险</span></div><span>{issue.project} · {issue.owner} · {issue.updated}</span><small>下一步：{issue.next}{issue.source ? ` · 来源：${issue.source}` : ''}</small></div><select className="issue-status-select" aria-label={`${issue.title} 状态`} value={issue.status} onChange={(event) => onUpdateIssue(issue.id, { status: event.target.value as Issue['status'] })}><option value="开放">开放</option><option value="等待外部">等待外部</option><option value="已解决">已解决</option></select></article>)}{!issues.length && <EmptyState icon={CircleAlert} title="还没有问题记录" description="把不确定性写出来，下一步才有落点。" />}</div></section>
      <section className="decision-panel card-surface"><div className="section-header compact-header"><div><div className="eyebrow">DECISIONS</div><h2>决策记录</h2></div><ShieldCheck size={17} /></div><div className="decision-list">{decisions.map((decision) => <article className="decision-card" key={decision.id}><div className="decision-top"><span className={`decision-status ${decision.status === '已决定' ? 'settled' : 'pending'}`}>{decision.status}</span><small>{decision.date}</small></div><h3>{decision.title}</h3><p>{decision.result}</p><span className="decision-evidence"><FileSearch size={13} /> {decision.evidence}</span></article>)}{!decisions.length && <EmptyState icon={ShieldCheck} title="还没有决策记录" description="把关键取舍留下来，避免反复讨论。" compact />}</div></section>
    </div>
  </>
}

function TemplatesPage({ templates, onNotify }: { templates: Template[]; onNotify: (message: string) => void }) {
  const copyTemplate = async (template: Template) => {
    try {
      await navigator.clipboard?.writeText(template.content)
      onNotify(`“${template.title}”已复制，可直接开始填写`)
    } catch {
      onNotify('模板已准备好，请在卡片中打开后复制')
    }
  }
  return <>
    <PageHeader eyebrow="TEMPLATES · REPEAT WELL" title="模板库" description="把已经想清楚的工作方法留下来，下一次直接进入状态。" actions={<button className="outline-button" onClick={() => onNotify('模板会随你的使用持续沉淀')}><Sparkles size={15} /> 模板使用建议</button>} />
    <div className="template-intro card-surface"><div className="template-intro-mark"><BookOpen size={20} /></div><div><strong>模板不是限制，是起跑线。</strong><span>会议纪要、供应商尽调、周复盘和生活安排都从同一套证据—行动结构开始。</span></div><span className="template-count">{templates.length} 个可用模板</span></div>
    <div className="template-grid">{templates.map((template) => <article className="template-card" key={template.id}><div className="template-card-top"><span className="template-category">{template.category}</span><button className="icon-button tiny" aria-label={`查看${template.title}`} onClick={() => onNotify(`${template.title}：${template.description}`)}><MoreHorizontal size={16} /></button></div><h3>{template.title}</h3><p>{template.description}</p><div className="template-card-footer"><span>{template.updated} · 使用 {template.uses} 次</span><button className="text-button" onClick={() => copyTemplate(template)}>复制使用 <ArrowUpRight size={14} /></button></div></article>)}{!templates.length && <EmptyState icon={BookOpen} title="还没有模板" description="把一次做好的流程保存下来，下一次就不用从空白开始。" />}</div>
  </>
}

function ReviewPage({ data, space }: { data: AppData; space: Space }) {
  const tasks = data.tasks.filter((task) => space === 'all' || task.space === space)
  const completed = tasks.filter((task) => task.status === 'done').length
  const waiting = tasks.filter((task) => task.status === 'waiting').length
  const activeProjects = data.projects.filter((project) => space === 'all' || project.space === space)
  return <>
    <PageHeader eyebrow="REVIEW · MAKE IT CLEAR" title="复盘" description="不是给自己打分，而是决定下一周把注意力放在哪里。" actions={<button className="primary-button"><RotateCcw size={16} /> 开始本周复盘</button>} />
    <div className="review-grid"><div className="review-hero card-surface"><div className="eyebrow">THIS WEEK</div><h2>把忙碌还原成结果。</h2><p>本周先看完成证据、长期等待和没有下一步的项目，再决定下一周的容量。</p><div className="review-stats"><div><strong>{completed}</strong><span>已完成</span></div><div><strong>{waiting}</strong><span>等待外部</span></div><div><strong>{activeProjects.filter((project) => project.health === 'risk').length}</strong><span>风险项目</span></div></div></div><div className="review-checklist card-surface"><div className="section-header compact-header"><h3>周复盘检查</h3><ListChecks size={17} /></div>{['本周最有价值的三个结果', '哪个等待事项需要一次明确跟进', '哪个项目没有唯一下一步', '下周要主动删掉什么'].map((item) => <label className="review-check" key={item}><input type="checkbox" /><span>{item}</span><ChevronRight size={14} /></label>)}</div></div>
    <div className="section-header list-section-header"><div><div className="eyebrow">PERSONAL SIGNALS</div><h2>本周的提醒</h2></div></div><div className="signal-grid"><SignalCard tone="blue" icon={FileSearch} title="资料没有变成行动" text={`${data.files.filter((file) => file.status === '待确认').length} 份资料还在待确认区，可能影响下一步安排。`} /><SignalCard tone="amber" icon={Clock3} title="等待时间需要复查" text={`${waiting} 个事项正在等待外部，建议补一个下次跟进时间。`} /><SignalCard tone="sage" icon={HeartPulse} title="生活安排有位置" text="把运动、恢复和个人记录当成真实日程，而不是剩余时间。" /></div>
  </>
}

function FileListRow({ file, onOpen, onConfirm }: { file: FileRecord; onOpen: () => void; onConfirm: () => void }) {
  return <div className="file-list-row"><button className="file-list-main" onClick={onOpen}><span className={`large-file-icon ${file.type === '供应商简报' ? 'supplier' : file.type === '生活文件' ? 'life' : 'meeting'}`}><FileText size={19} /></span><span><strong>{file.name}</strong><small>{file.type} · {file.source} · {file.size}</small></span></button><span className="file-summary">{file.summary}</span><span className="file-date">{file.updated}</span><button className="outline-button" onClick={onConfirm}><Check size={14} /> 确认</button><button className="icon-button tiny" onClick={onOpen}><MoreHorizontal size={16} /></button></div>
}

function FileCard({ file, onOpen }: { file: FileRecord; onOpen: () => void }) {
  return <button className="file-card" onClick={onOpen}><div className="file-card-top"><span className={`large-file-icon ${file.type === '供应商简报' ? 'supplier' : file.type === '生活文件' ? 'life' : 'meeting'}`}><FileText size={19} /></span><span className={`status-dot status-${file.status === '已关联' ? 'good' : file.status === '已分析' ? 'mid' : 'pending'}`} /></div><div className="file-card-copy"><strong>{file.name}</strong><span>{file.type} · {file.size}</span><small>{file.summary}</small></div><div className="file-card-footer"><span>{file.updated}</span><span>{file.status}</span></div></button>
}

function ProjectCard({ project, taskCount }: { project: Project; taskCount: number }) {
  const Icon = projectIcons[project.id === 'p1' ? 'school' : project.id === 'p2' ? 'robot' : project.id === 'p3' ? 'supplier' : project.id === 'p4' ? 'wormhole' : project.space === 'life' ? 'life' : 'marketing'] || FolderKanban
  return <div className="project-card"><div className="project-card-top"><span className={`project-icon health-${project.health}`}><Icon size={18} /></span><span className={`health-label ${project.health}`}>{project.status}</span><button className="icon-button tiny"><MoreHorizontal size={16} /></button></div><div className="project-card-title"><h3>{project.name}</h3><span>{project.type}</span></div><p>{project.description}</p><div className="project-next"><span>下一步</span><strong>{project.next}</strong></div><div className="project-card-footer"><div className="progress-track"><i style={{ width: `${project.progress}%` }} /></div><span>{project.progress}% · {taskCount} 个进行中</span></div><div className="project-updated">最近更新 {project.updated}</div></div>
}

function SignalCard({ tone, icon: Icon, title, text }: { tone: string; icon: LucideIcon; title: string; text: string }) {
  return <div className={`signal-card signal-${tone}`}><Icon size={18} /><strong>{title}</strong><p>{text}</p><button className="text-button">查看 <ArrowUpRight size={14} /></button></div>
}

function FileDrawer({ file, onClose, onConfirm, onAddTask, onNotify }: { file: FileRecord; onClose: () => void; onConfirm: () => void; onAddTask: (title: string) => void; onNotify: (message: string) => void }) {
  return <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><aside className="file-drawer"><div className="drawer-header"><div><div className="eyebrow">DOCUMENT ANALYSIS</div><h2>资料详情</h2></div><button className="icon-button" onClick={onClose} aria-label="关闭资料详情"><X size={18} /></button></div><div className="drawer-file-title"><span className={`large-file-icon ${file.type === '供应商简报' ? 'supplier' : file.type === '生活文件' ? 'life' : 'meeting'}`}><FileText size={22} /></span><div><h3>{file.name}</h3><span>{file.type} · {file.size} · {file.source}</span></div></div><div className="drawer-actions"><button className="outline-button" onClick={() => onNotify('原件索引已保留；本地文件桥接将在第二阶段接入')}><Download size={14} /> 原件索引</button><button className="outline-button" onClick={() => onNotify('关联项目需要你确认目标容器，建议先从建议行动开始')}><Paperclip size={14} /> 关联项目</button>{file.status === '待确认' && <button className="primary-button compact" onClick={onConfirm}><Check size={15} /> 确认入库</button>}</div><div className="analysis-state"><span className="analysis-pulse"><Sparkles size={15} /></span><div><strong>{file.status === '待确认' ? '分析建议已生成，等待确认' : '已进入结构化资料库'}</strong><span>所有结论都应回到原文，并可撤销。</span></div></div><div className="drawer-tabs"><button className="selected">摘要</button><button>任务</button><button>问题</button><button>版本</button></div><div className="drawer-body"><section><div className="eyebrow">SUMMARY</div><p className="drawer-summary">{file.summary}</p></section><section><div className="section-header compact-header"><h3>文件事实</h3><span className="source-chip">原文提取</span></div><div className="fact-list">{file.facts.map((fact) => <div className="fact-row" key={fact}><CheckSquare2 size={14} /><span>{fact}</span></div>)}</div></section><section><div className="section-header compact-header"><h3>建议行动</h3><span className="source-chip proposed">待确认</span></div><div className="suggestion-list">{file.suggestions.map((suggestion) => <div className="suggestion-row" key={suggestion}><span className="suggestion-bullet" /><span>{suggestion}</span><button className="icon-button tiny" aria-label={`把建议加入任务：${suggestion}`} onClick={() => onAddTask(suggestion)}><Plus size={14} /></button></div>)}</div></section><section className="source-preview"><div className="eyebrow">SOURCE PREVIEW</div><div className="fake-document"><div className="fake-line wide" /><div className="fake-line" /><div className="fake-line medium" /><div className="fake-gap" /><div className="fake-line wide" /><div className="fake-line" /><div className="fake-line medium" /><span>点击分析结论可回到原文页码 · 解析服务将在第二阶段接入</span></div></section></div></aside></div>
}

function Composer({ kind, title, space, setTitle, setSpace, onClose, onSubmit }: { kind: 'task' | 'idea' | 'issue' | 'project'; title: string; space: Exclude<Space, 'all'>; setTitle: (value: string) => void; setSpace: (value: Exclude<Space, 'all'>) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const copy = kind === 'task' ? { eyebrow: 'QUICK CAPTURE', heading: '记录一个下一步', label: '要做什么？', placeholder: '例如：确认供应商补充的安全资料', submit: '加入今日' } : kind === 'idea' ? { eyebrow: 'IDEA CAPTURE', heading: '捕获一个灵感', label: '想到什么？', placeholder: '先写下来，不必现在整理', submit: '保存灵感' } : kind === 'issue' ? { eyebrow: 'OPEN LOOP', heading: '记录一个问题', label: '哪里还不清楚？', placeholder: '例如：供应商没有给出数据退出机制', submit: '加入问题库' } : { eyebrow: 'NEW CONTAINER', heading: '创建一个项目容器', label: '这个容器叫什么？', placeholder: '例如：秋季家庭旅行 / 区域学校试点', submit: '创建容器' }
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><form className="composer-modal" onSubmit={onSubmit}><div className="modal-header"><div><div className="eyebrow">{copy.eyebrow}</div><h2>{copy.heading}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div><label className="field-label">{copy.label}<textarea autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder={copy.placeholder} rows={3} /></label><label className="field-label">所属空间<select value={space} onChange={(event) => setSpace(event.target.value as Exclude<Space, 'all'>)}><option value="work">工作</option><option value="life">生活</option><option value="private">私密</option></select></label><div className="modal-footer"><span className="private-hint"><LockKeyhole size={13} /> 私密内容默认不进入代理分析</span><button type="button" className="outline-button" onClick={onClose}>取消</button><button type="submit" className="primary-button" disabled={!title.trim()}>{copy.submit}</button></div></form></div>
}

function SearchOverlay({ data, onClose, onOpenFile, onSelectTask, onSelectIssue, onSelectTemplate }: { data: AppData; onClose: () => void; onOpenFile: (file: FileRecord) => void; onSelectTask: (task: Task) => void; onSelectIssue: (issue: Issue) => void; onSelectTemplate: (template: Template) => void }) {
  const [query, setQuery] = useState('')
  const normalized = query.trim().toLowerCase()
  const tasks = data.tasks.filter((task) => !normalized || `${task.title} ${task.project} ${task.source || ''}`.toLowerCase().includes(normalized)).slice(0, 4)
  const files = data.files.filter((file) => !normalized || `${file.name} ${file.summary} ${file.project || ''}`.toLowerCase().includes(normalized)).slice(0, 4)
  const projects = data.projects.filter((project) => !normalized || `${project.name} ${project.description}`.toLowerCase().includes(normalized)).slice(0, 3)
  const issues = data.issues.filter((issue) => !normalized || `${issue.title} ${issue.project} ${issue.next}`.toLowerCase().includes(normalized)).slice(0, 3)
  const templates = data.templates.filter((template) => !normalized || `${template.title} ${template.category} ${template.description}`.toLowerCase().includes(normalized)).slice(0, 3)
  return <div className="search-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="search-modal"><div className="search-input-wrap"><Search size={19} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索任务、项目、文件、问题、模板……" /><kbd>ESC</kbd></div><div className="search-results">{projects.length > 0 && <SearchGroup title="项目" icon={FolderKanban}>{projects.map((project) => <button className="search-result" key={project.id}><span className="result-icon"><FolderKanban size={15} /></span><span><strong>{project.name}</strong><small>{project.next}</small></span><ChevronRight size={14} /></button>)}</SearchGroup>}{tasks.length > 0 && <SearchGroup title="任务" icon={CheckSquare2}>{tasks.map((task) => <button className="search-result" key={task.id} onClick={() => onSelectTask(task)}><span className="result-icon"><CheckSquare2 size={15} /></span><span><strong>{task.title}</strong><small>{task.project} · {displayDate(task.due)}</small></span><ChevronRight size={14} /></button>)}</SearchGroup>}{issues.length > 0 && <SearchGroup title="问题" icon={CircleAlert}>{issues.map((issue) => <button className="search-result" key={issue.id} onClick={() => onSelectIssue(issue)}><span className="result-icon"><CircleAlert size={15} /></span><span><strong>{issue.title}</strong><small>{issue.project} · {issue.status}</small></span><ChevronRight size={14} /></button>)}</SearchGroup>}{templates.length > 0 && <SearchGroup title="模板" icon={BookOpen}>{templates.map((template) => <button className="search-result" key={template.id} onClick={() => onSelectTemplate(template)}><span className="result-icon"><BookOpen size={15} /></span><span><strong>{template.title}</strong><small>{template.category} · 使用 {template.uses} 次</small></span><ChevronRight size={14} /></button>)}</SearchGroup>}{files.length > 0 && <SearchGroup title="资料" icon={FileText}>{files.map((file) => <button className="search-result" key={file.id} onClick={() => onOpenFile(file)}><span className="result-icon"><FileText size={15} /></span><span><strong>{file.name}</strong><small>{file.type} · {file.status}</small></span><ChevronRight size={14} /></button>)}</SearchGroup>}{normalized && !projects.length && !tasks.length && !issues.length && !templates.length && !files.length && <EmptyState icon={Search} title="没有找到匹配内容" description="试试项目名、文件名、问题或任务中的关键词。" compact />}{!normalized && <div className="search-hint"><Command size={16} /> 输入关键词即可搜索全局工作台 <span>支持文件名、项目、任务、问题和模板</span></div>}</div></div></div>
}

function SearchGroup({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return <section className="search-group"><div className="search-group-title"><Icon size={14} /> {title}</div>{children}</section>
}

function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return <section className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{actions && <div className="page-header-actions">{actions}</div>}</section>
}

function EmptyState({ icon: Icon, title, description, compact = false }: { icon: LucideIcon; title: string; description: string; compact?: boolean }) {
  return <div className={`empty-state ${compact ? 'compact' : ''}`}><span className="empty-icon"><Icon size={compact ? 18 : 24} /></span><strong>{title}</strong><span>{description}</span></div>
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

function guessFileType(name: string): FileType {
  const lower = name.toLowerCase()
  if (lower.includes('会议') || lower.includes('纪要')) return '会议纪要'
  if (lower.includes('供应商') || lower.includes('平台') || lower.includes('简报')) return '供应商简报'
  if (lower.includes('日报') || lower.includes('笔记') || lower.includes('记录')) return '个人记录'
  if (lower.includes('账单') || lower.includes('报销') || lower.includes('健康') || lower.includes('体检')) return '生活文件'
  if (lower.includes('合同') || lower.includes('方案') || lower.includes('报价')) return '方案/合同'
  return '其他'
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default App
