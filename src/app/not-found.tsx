import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
        <p className="text-xl text-gray-700 mb-2">ページが見つかりません</p>
        <p className="text-gray-500 mb-6">お探しのページは存在しないか、移動した可能性があります。</p>
        <Link href="/" className="btn-primary">
          ダッシュボードへ戻る
        </Link>
      </div>
    </div>
  )
}
