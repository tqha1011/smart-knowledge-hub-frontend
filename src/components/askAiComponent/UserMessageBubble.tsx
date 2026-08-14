import type { UserChatMessage } from "../../types";

interface UserMessageBubbleProps {
  message: UserChatMessage;
}

// Right-aligned, accent-filled bubble for the user's own questions, per spec.
export function UserMessageBubble({ message }: UserMessageBubbleProps) {
  return (
    <div className="bg-accent ml-auto w-fit max-w-[80%] rounded-lg rounded-tr-sm px-3 py-2 text-sm text-white">
      {message.question}
    </div>
  );
}
