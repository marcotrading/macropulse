export function Card({ children, className, ...props }) {
  return <div className={`rounded-xl shadow border border-gray-200 ${className}`} {...props}>{children}</div>;
}

export function CardHeader({ children }) {
  return <div className="p-3 border-b border-gray-200">{children}</div>;
}

export function CardTitle({ children }) {
  return <h2 className="font-bold text-lg">{children}</h2>;
}

export function CardContent({ children }) {
  return <div className="p-3">{children}</div>;
}

