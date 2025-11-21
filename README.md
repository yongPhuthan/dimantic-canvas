นี่คือเอกสาร **PRD (Product Requirements Document)** ที่ได้รับการปรับปรุงเนื้อหาให้เปลี่ยนจาก **PixiJS** มาเป็น **React Flow 12 (@xyflow/react)** โดยยังคงรักษา Concept หลักคือ **"Semantic-Driven / No-Coordinate"** (รับ JSON ดิบจาก Neo4j แล้วระบบจัดท่าให้เอง) ครับ

---

# **Product Requirements Document (PRD)**

## **Project: React Flow Diagram Framework (Codenamed: GraphWeaver-RF)**

**Phase:** 1.0 - Proof of Concept (UML Use Case Diagram)  
**Role:** Lead Frontend Architect  
**Date:** 2025-11-21 (Updated for React Flow Migration)

## **1. Project Overview & Background**

### **1.1 The Context & Problem**
(คงเดิม) ทีมงานเก็บข้อมูลใน Neo4j (C4 Model, UML) แต่ประสบปัญหา Visualization ที่เป็น Static Image (MermaidJS) ไม่สามารถ Interactive ได้ และการจัด Layout อัตโนมัติทำได้ไม่ดีเมื่อกราฟซับซ้อน

### **1.2 The Solution: "GraphWeaver-RF" Adapter**
เราจะเปลี่ยนมาใช้ **React Flow 12 (@xyflow/react)** เป็น **"Diagram View Engine"** แทนการวาดกราฟิกเองทั้งหมด ด้วยเหตุผลด้านการปรับแต่ง UI ที่ง่ายกว่า (HTML/CSS) และ Ecosystem ที่แข็งแกร่ง โดยระบบยังคงทำหน้าที่:

* **Interactive Canvas:** รองรับ Pan, Zoom, Drag, Click, Select, Multi-select โดยใช้ความสามารถ Native ของ React Flow
* **Semantic-Driven Input:** รับ **Pure Graph Data (JSON)** จาก Neo4j โดย **ไม่ต้อง** มีพิกัด (x, y)
* **Auto-Layout Middleware:** มี Layer กลางสำหรับคำนวณตำแหน่ง Node และ Route เส้น โดยใช้ Algorithm ภายนอก (ELK.js) ก่อนส่งให้ React Flow เรนเดอร์

### **1.3 Scope of Phase 1**
* **Diagram Type:** UML Use Case Diagram
* **Goal:** รับ Mock JSON -> ผ่าน Layout Engine -> แสดงผล Actor, Use Case, System Boundary บน React Flow โดยที่ Node ไม่ทับกันและเส้นสวยงาม

## **2. Conceptual Model (The Adapter Pattern)**

เราเปลี่ยนจากการ "วาดเองทุกพิกเซล" (PixiJS) เป็นการ **"แปลง Data เป็น React Props"**

1.  **Input:** Pure JSON (Nodes & Edges) ไม่มี x,y
2.  **Process (The Layout Middleware):**
    * ใช้ Library เช่น **ELK.js** (Eclipse Layout Kernel) เพื่อคำนวณ x, y, width, height ของ Node และ Sub-graph (Container)
3.  **Output:** แปลงผลลัพธ์เป็น `<ReactFlow nodes={calculatedNodes} edges={edges} />`

## **3. Data Specifications (Input Contract)**

(คงเดิม - ส่วนนี้เป็น Agnostic ไม่ขึ้นกับ Library)
* Input ยังคงเป็น `nodes` (id, type, label, parentId) และ `edges` (source, target, type) เหมือนเดิมทุกประการ

## **4. Functional Requirements**

### **4.1 The Renderer (React Flow 12)**

* **FR-REN-01:** ใช้ `@xyflow/react` เป็น Core Component
* **FR-REN-02:** ใช้ `<ReactFlowProvider />` เพื่อเข้าถึง Instance และจัดการ Viewport
* **FR-REN-03 (Component Registry):** สร้าง **Custom Nodes** (React Components) ตาม `type`:
    * `ACTOR`: Component แสดง `img/svg` รูปคน (Stickman) พร้อม Label ด้านล่าง
    * `USE_CASE`: Component รูปทรงวงรี (`border-radius: 50%`) มี Text ตรงกลาง
    * `SYSTEM_BOUNDARY`: Component แบบ **Group Node** (โปร่งใส มีขอบ) ที่รองรับ `parentId` เพื่อครอบ Node ลูก
* **FR-REN-04 (Styling):** ใช้ **Tailwind CSS** ในการตกแต่ง Node (Shadow, Border, Color) แทนการวาด Graphics

### **4.2 Auto Layout Engine (The Middleware)**

เนื่องจาก React Flow ไม่มี Auto-layout ในตัว และเราต้องการรองรับ Nested Node (System Boundary) จึงต้องใช้ **ELK.js** (ดีที่สุดสำหรับ Layered Graph)

* **FR-LAY-01 (Transformation):** ระบบต้องมี Hook `useAutoLayout` ที่รับ Nodes/Edges ดิบ และส่งคืน Nodes/Edges ที่มี `position: {x, y}` แล้ว
* **FR-LAY-02 (Strategy):** Config ELK ให้จัด Layout แบบ:
    * Algorithm: `layered`
    * Direction: `RIGHT` (Actor ซ้าย -> Use Case ขวา)
    * Hierarchy Handling: `INCLUDE_CHILDREN` (จัดการ Node ที่อยู่ใน System Boundary ให้ไม่ทับกันเอง)

### **4.3 Advanced Edge Routing (Custom Edges)**

* **FR-RTE-01: Smart Connection Points (Floating Edges)**
    * แทนที่จะใช้ Handle จุดเดียวตายตัว ให้ใช้เทคนิค **Floating Handles** (คำนวณจุดตัด Dynamic เหมือน FR-RTE-01 เดิม) หรือใช้ `<Handle position={Position.Left | Right} />` แบบหลายจุดเพื่อให้ React Flow เลือกจุดที่ใกล้ที่สุดเอง
* **FR-RTE-02: Edge Styling & Types**
    * `ASSOCIATION`: เส้นทึบ (Default Edge)
    * `INCLUDE`: เส้นประ (Dashed Edge) พร้อม Label `<<include>>` ตรงกลางเส้น
    * `EXTEND`: เส้นประ พร้อม Label `<<extend>>`
* **FR-RTE-03: Z-Index & Layers**
    * System Boundary ต้องอยู่ Layer ล่างสุด (Z-Index ต่ำ) เพื่อไม่ให้บัง Use Case ข้างใน

## **5. Technical Implementation Guidelines**

### **5.1 Tech Stack**

* **Language:** TypeScript
* **Framework:** React (Vite)
* **Core Library:** `@xyflow/react` (v12)
* **Layout Engine:** `elkjs` (Web Worker version เพื่อไม่ให้บล็อก Main Thread)
* **Styling:** Tailwind CSS

### **5.2 Architecture Layers**

1.  **Data Layer:** `useMockGraphData.ts` (Load JSON)
2.  **Middleware Layer (The Brain):**
    * `useLayoutEngine.ts`: เรียกใช้ `elkjs` เพื่อคำนวณตำแหน่ง x,y ของ Nodes และขนาดของ System Boundary
3.  **Presentation Layer:**
    * `DiagramCanvas.tsx`: เรียกใช้ `<ReactFlow />`
    * `nodeTypes/`:
        * `ActorNode.tsx`
        * `UseCaseNode.tsx`
        * `SystemNode.tsx` (Group Node)
    * `edgeTypes/`:
        * `FloatingEdge.tsx` (Custom Edge ที่คำนวณจุดตัดขอบ Node)

## **6. Acceptance Criteria (PoC)**

1.  [ ] โหลดหน้าเว็บแล้วเห็น Use Case Diagram แสดงผลถูกต้องตาม JSON
2.  [ ] **System Boundary** ครอบคลุม Use Case Nodes ข้างในได้อย่างถูกต้อง (ขนาด Dynamic ตามลูก)
3.  [ ] **Actor** อยู่ด้านซ้าย, **System** อยู่ด้านขวา (ตาม ELK Layout)
4.  [ ] สามารถลาก Node (Drag) แล้วเส้นขยับตามได้ลื่นไหล (React Flow จัดการให้)
5.  [ ] เส้นเชื่อม `<<include>>` แสดงเป็นเส้นประ
6.  [ ] รองรับการเปลี่ยนขนาดหน้าจอ (Responsive) และ Fit View อัตโนมัติเมื่อโหลดเสร็จ

---

### **จุดเด่นของการเปลี่ยนมาใช้ React Flow (Why this is better?)**

1.  **Styling ง่ายกว่ามาก:** การแก้สี Actor, การใส่เงา, หรือเปลี่ยน Font ใช้ CSS/Tailwind ได้เลย ไม่ต้องคำนวณ Canvas Drawing API
2.  **Native DOM Events:** ใส่ปุ่ม, Input, หรือ Tooltip บน Node ได้ง่ายเหมือนเขียนเว็บปกติ (ไม่ต้องทำ Raycasting เพื่อหาจุดคลิกแบบ PixiJS)
3.  **Group/Parenting:** React Flow รองรับ `parentId` และ `extent: 'parent'` ซึ่งเหมาะมากกับ C4 Model (Container/Component)
4.  **Maintenance:** โค้ดจะสั้นลงประมาณ 40-50% เพราะตัดส่วน Event Handling, Drag System, Zoom System ออกไปใช้ของ Library แทน