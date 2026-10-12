import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

// next/image mock để tránh lỗi khi test ngoài môi trường Next.js
vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
    const { priority, ...rest } = props
    return <img {...rest} />
  },
}))

describe('Home page', () => {
  beforeEach(() => {
    render(<Home />)
  })

  it('renders the Next.js logo', () => {
    const logo = screen.getByAltText('Next.js logo')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', '/next.svg')
  })

  it('renders the heading text', () => {
    expect(
      screen.getByRole('heading', { name: /to get started, edit the page\.tsx file/i })
    ).toBeInTheDocument()
  })

  it('renders the author credit', () => {
    expect(screen.getByText(/Created by @hoidanit/i)).toBeInTheDocument()
  })

  it('renders the AI & Coding link pointing to hoidanit.vn', () => {
    const link = screen.getByRole('link', { name: /AI & Coding/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://hoidanit.vn/khoa-hoc?type=vibecoding')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders the Documentation link pointing to hoidanit.vn', () => {
    const link = screen.getByRole('link', { name: /Documentation/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://hoidanit.vn/')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders the Vercel logo inside the AI & Coding link', () => {
    const logo = screen.getByAltText('Vercel logomark')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', '/vercel.svg')
  })
})
