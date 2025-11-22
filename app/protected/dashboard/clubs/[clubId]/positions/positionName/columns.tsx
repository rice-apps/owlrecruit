"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Star } from "lucide-react"

export type Application = {
  id: string
  name: string
  email: string
  rating: number
  status: string
}

export const columns: ColumnDef<Application>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("name")}</div>
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      return <div className="text-muted-foreground">{row.getValue("email")}</div>
    },
  },
  {
    accessorKey: "rating",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Rating
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const rating = parseFloat(row.getValue("rating"))
      return (
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="font-medium">{rating.toFixed(1)}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as string

      const getStatusVariant = (status: string) => {
        switch (status.toLowerCase()) {
          case "accepted":
            return "success"
          case "rejected":
            return "destructive"
          case "under review":
            return "secondary"
          case "interviewing":
            return "outline"
          default:
            return "secondary"
        }
      }

      return (
        <Badge variant={getStatusVariant(status)}>
          {status}
        </Badge>
      )
    },
    sortingFn: (rowA, rowB, columnId) => {
      const statusOrder = {
        "rejected": 0,
        "pending": 1,
        "under review": 2,
        "interviewing": 3,
        "accepted": 4,
      }

      const statusA = (rowA.getValue(columnId) as string).toLowerCase()
      const statusB = (rowB.getValue(columnId) as string).toLowerCase()

      const orderA = statusOrder[statusA as keyof typeof statusOrder] ?? 999
      const orderB = statusOrder[statusB as keyof typeof statusOrder] ?? 999

      return orderA - orderB
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
]
