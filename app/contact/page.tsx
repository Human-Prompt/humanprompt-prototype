export default function Contact() {
  return (
    <div className="py-12 flex flex-col items-center justify-center min-h-[70vh]">
      <h1 className="text-center text-2xl mb-24">contact us</h1>

      <div className="text-center max-w-2xl">
        <p className="text-xl mb-2">
          for all enquiries, please e-mail{" "}
          <a
            href="mailto:invest@humanprompt.ai"
            className="text-white hover:opacity-80 transition-opacity cursor-default hover:cursor-pointer"
          >
            invest@humanprompt.ai
          </a>
        </p>
        <p className="text-gray-400 italic">
          (alternate direct line:{" "}
          <a
            href="mailto:stevenfarah@humanprompt.ai"
            className="text-gray-400 hover:opacity-80 transition-opacity cursor-default hover:cursor-pointer"
          >
            stevenfarah@humanprompt.ai
          </a>
          )
        </p>
      </div>
    </div>
  )
}
