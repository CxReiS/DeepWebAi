import React from 'react'
import { motion } from 'framer-motion'
import { 
  MessageCircle, 
  Code, 
  Brain, 
  Zap, 
  Users, 
  BarChart3,
  TrendingUp,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

interface DashboardProps {
  className?: string
}

const stats = [
  {
    title: 'Total Chats',
    value: '1,234',
    change: '+12%',
    icon: MessageCircle,
    trend: 'up'
  },
  {
    title: 'Code Generated',
    value: '45.2K',
    change: '+8%',
    icon: Code,
    trend: 'up'
  },
  {
    title: 'AI Requests',
    value: '8,923',
    change: '+23%',
    icon: Brain,
    trend: 'up'
  },
  {
    title: 'Active Users',
    value: '2,301',
    change: '+5%',
    icon: Users,
    trend: 'up'
  }
]

const quickActions = [
  {
    title: 'New Chat',
    description: 'Start a conversation with AI',
    icon: MessageCircle,
    color: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
  },
  {
    title: 'Generate Code',
    description: 'Create code snippets quickly',
    icon: Code,
    color: 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
  },
  {
    title: 'Analyze Data',
    description: 'Process and understand data',
    icon: BarChart3,
    color: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20'
  },
  {
    title: 'Optimize Performance',
    description: 'Improve code efficiency',
    icon: Zap,
    color: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'
  }
]

const recentActivity = [
  {
    title: 'Code review completed',
    description: 'React component optimization',
    time: '2 minutes ago',
    icon: Code
  },
  {
    title: 'New chat session',
    description: 'Debugging Python script',
    time: '5 minutes ago',
    icon: MessageCircle
  },
  {
    title: 'Performance analysis',
    description: 'Database query optimization',
    time: '12 minutes ago',
    icon: TrendingUp
  },
  {
    title: 'Documentation generated',
    description: 'API endpoint documentation',
    time: '1 hour ago',
    icon: Brain
  }
]

export function Dashboard({ className }: DashboardProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your AI workspace.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="card-modern hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <div className="flex items-center text-sm">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-500">{stat.change}</span>
                      <span className="text-muted-foreground ml-1">from last month</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="card-modern">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      'h-auto p-4 w-full justify-start',
                      action.color
                    )}
                  >
                    <div className="flex items-start space-x-3 text-left">
                      <action.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <div className="font-medium">{action.title}</div>
                        <div className="text-xs opacity-80">
                          {action.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <activity.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{activity.title}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {activity.description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {activity.time}
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Usage Chart Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Usage Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-primary/50 mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Analytics chart would be displayed here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
