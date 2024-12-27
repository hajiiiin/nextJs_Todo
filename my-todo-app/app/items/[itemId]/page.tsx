//items/[itemId]/page.tsx
"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { TENANT_ID } from "../../TodoList/TodoList";
import "../items.styles.css";

type TodoItem = {
  id: number;
  name: string;
  isCompleted: boolean;
  memo?: string;
  imageUrl?: string;
};

export default function itemDetails() {
  const router = useRouter();
  const { itemId } = useParams(); // 동적 경로에서 itemId 가져오기

  // API URL
  const API_URL = `https://assignment-todolist-api.vercel.app/api/${TENANT_ID}/items`;

  const [todo, setTodo] = useState<TodoItem | null>(null);
  const [memo, setMemo] = useState("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [isCompleted, setisCompleted] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(""); // imageUrl 상태 추가

  // 데이터 로드 (Get 요청)
  useEffect(() => {
    const fetchTodo = async () => {
      try {
        // Fetch 호출
        const response = await fetch(`${API_URL}/items/${itemId}`);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch item: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        setTodo(data); // 데이터 설정
        setMemo(data.memo || ""); // 메모 설정
        setImageUrl(data.imageUrl || ""); // 이미지 url 설정
      } catch (error) {
        console.error(error); // 콘솔에 상세 오류 출력
        alert("할 일 정보를 가져오는 데 실패했습니다."); // 사용자에게 알림
        router.push("/"); // 오류 발생 시 홈으로 이동
      }
    };

    fetchTodo();
  }, [itemId, router]);

  // 메모 변경 감지
  const handleMemoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMemo(e.target.value);
    setisCompleted(true); // 메모 변경 시 수정 완료 버튼 활성화
  };

  // 이미지 파일 업로드
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 이름 확인
    if (!/^[a-zA-Z0-9_.-]+$/.test(file.name)) {
      alert("파일 이름은 영어와 숫자만 포함되어야 합니다.");
      return;
    }

    // 파일 크기 확인
    const maxFileSize = 5 * 1024 * 1024; // 5MB 제한
    if (file.size > maxFileSize) {
      alert("파일 크기가 너무 큽니다. 5MB 이하로 업로드하세요.");
      return;
    }

    setUploadedImage(file);
    setisCompleted(true);

    // 이미지 업로드 처리
    const formData = new FormData();
    formData.append("image", file);

    const uploadResponse = await fetch(`${API_URL}/images/upload`, {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorDetails = await uploadResponse.text(); // 서버 응답 메시지 확인
      console.error("Image upload failed:", errorDetails);
      return;
    }

    const uploadData = await uploadResponse.json();
    console.log("Uploaded image URL:", uploadData.url);
    setImageUrl(uploadData.url); // 이미지 URL 상태 설정
  };

  // 수정 핸들러
  const handleSave = async () => {
    try {
      if (!todo) return;

      let updatedImageUrl = imageUrl; // 현재 상태의 imageUrl 사용

      console.log("Sending to PATCH:", {
        name: todo.name,
        memo,
        imageUrl: updatedImageUrl,
        isCompleted: todo.isCompleted,
      });

      // 서버에 수정 요청
      const response = await fetch(`${API_URL}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: todo.name,
          memo,
          imageUrl: updatedImageUrl,
          isCompleted: todo.isCompleted,
        }),
      });

      if (!response.ok) throw new Error("Failed to update item");
      const updatedTodo = await response.json();

      // 클라이언트 상태 업데이트
      setTodo(updatedTodo);
      setisCompleted(false);
      alert("수정되었습니다.");
      router.push("/");
    } catch (error) {
      console.error(error);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  // 데이터 삭제
  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_URL}/items/${itemId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete item");
      alert("삭제되었습니다.");
      router.push("/");
      router.refresh(); // 최신 데이터 반영
    } catch (error) {
      console.error(error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 상태 변경 핸들러 (POST 요청)
  const toggleTaskStatus = async () => {
    if (!todo) return; // 현재 todo가 없으면 종료

    try {
      const updatedIsCompleted = !todo.isCompleted; // 상태 반전

      // 로컬 상태 반전
      setTodo({ ...todo, isCompleted: updatedIsCompleted });

      // 서버에 상태 업데이트 요청 (PATCH)
      const response = await fetch(`${API_URL}/items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: todo.name,
          memo: todo.memo,
          imageUrl: todo.imageUrl,
          isCompleted: updatedIsCompleted,
        }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      const updatedTodo = await response.json();
      setTodo(updatedTodo); // 서버 응답으로 상태 업데이트
    } catch (error) {
      console.error("Error in toggleTaskStatus:", error);
      alert("작업 상태를 업데이트하는 동안 오류가 발생했습니다.");
    }
  };

  if (!todo) return <p>Loading...</p>;

  return (
    <div className="item-details-container">
      <div
        key={todo.id}
        className={`todo-item ${todo.isCompleted ? "completed" : "pending"}`}
      >
        <label className="todo-label">
          <Image
            src={todo.isCompleted ? "/done-checkbox.png" : "/todo-checkbox.png"}
            alt={todo.isCompleted ? "Done" : "Todo"}
            width={32}
            height={32}
            onClick={() => {
              console.log("Before toggle:", todo.isCompleted); // 클릭 전 상태
              toggleTaskStatus();
            }}
          />
          <span
            style={{
              textDecoration: todo.isCompleted ? "underline" : "none",
              textAlign: "center",
            }}
          >
            {todo.name}
          </span>
        </label>
      </div>

      <div className="details-container">
        {/* 이미지 업로드 */}
        <div
          className="image-section"
          style={{
            backgroundImage: imageUrl
              ? `url(${imageUrl})`
              : todo?.imageUrl
              ? `url(${todo.imageUrl})` // 서버에서 가져온 이미지 URL
              : "",
            backgroundSize: "cover",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img
            className="img-section-img"
            src={
              uploadedImage
                ? URL.createObjectURL(uploadedImage)
                : "/default-image.png"
            }
            alt="Uploaded"
            style={{
              display: !imageUrl ? "block" : "none", // 조건에 따라 표시 여부 설정
              width: 64,
              height: 64,
            }}
          />

          {/* 숨겨진 파일 입력 */}
          <input
            type="file"
            id="file-input"
            style={{ display: "none" }} // 숨김 처리
            onChange={handleFileChange} // 파일 변경 시 호출
          />
          <Image
            className="add-image-btn"
            src={uploadedImage ? "/image-update.png" : "/image-add.png"}
            alt="add or update image"
            onClick={() => document.getElementById("file-input")?.click()}
            width={64}
            height={64}
          />
        </div>

        {/* 메모 입력 */}
        <div className="memo-section">
          <div className="memo-container">
            <h3 className="memo-title">Memo</h3>
            <div className="memo-text">
              <textarea
                value={memo}
                onChange={handleMemoChange}
                placeholder="메모를 추가하세요"
                className="memo-textarea"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      {/* 버튼 그룹 */}
      <div className="button-group">
        <Image
          onClick={handleSave}
          src={isCompleted ? "/save-icon-active.png" : "/save-icon.png"}
          alt="Save"
          width={168}
          height={56}
          style={{
            cursor: isCompleted ? "pointer" : "not-allowed",
            opacity: isCompleted ? 1 : 0.5,
          }}
        />

        <Image
          onClick={handleDelete}
          src="/delete-icon.png"
          alt="Delete"
          width={168}
          height={56}
        />
      </div>
    </div>
  );
}
