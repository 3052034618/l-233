import { Router, type Request, type Response } from 'express'
import jwt from 'jsonwebtoken'
import { users, type User } from '../db/index.js'

const router = Router()

const JWT_SECRET = 'funeral-secret-key'

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).json({
        success: false,
        data: null,
        message: '用户名和密码不能为空',
      })
      return
    }

    const user = await users.getByUsername(username)

    if (!user) {
      res.status(401).json({
        success: false,
        data: null,
        message: '用户名或密码错误',
      })
      return
    }

    if (user.password !== password) {
      res.status(401).json({
        success: false,
        data: null,
        message: '用户名或密码错误',
      })
      return
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' },
    )

    const { password: _pwd, ...userWithoutPassword } = user

    res.json({
      success: true,
      data: {
        token,
        user: userWithoutPassword,
      },
      message: '登录成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: '服务器内部错误',
    })
  }
})

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, name, role, phone } = req.body

    if (!username || !password || !name || !role) {
      res.status(400).json({
        success: false,
        data: null,
        message: '用户名、密码、姓名、角色不能为空',
      })
      return
    }

    const existingUser = await users.getByUsername(username)
    if (existingUser) {
      res.status(400).json({
        success: false,
        data: null,
        message: '用户名已存在',
      })
      return
    }

    const id = generateId('user')
    const newUser: Omit<User, 'created_at'> = {
      id,
      username,
      password,
      name,
      role,
      phone,
    }

    await users.create(newUser)

    const token = jwt.sign(
      { id, username, role },
      JWT_SECRET,
      { expiresIn: '7d' },
    )

    const { password: _pwd, ...userWithoutPassword } = newUser

    res.status(201).json({
      success: true,
      data: {
        token,
        user: userWithoutPassword,
      },
      message: '注册成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: '服务器内部错误',
    })
  }
})

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: null,
    message: '登出成功',
  })
})

export default router
