export class PriorityQueue<T> {
    private heap: T[];
    private compare: (a: T, b: T) => number;

    /**
     * 创建优先队列
     * @param compare 比较函数 (a, b) => 负数表示a应排在b前面
     */
    constructor(compare: (a: T, b: T) => number) {
        this.heap = [];
        this.compare = compare;
    }

    /**
     * 获取队列元素数量
     */
    get size(): number {
        return this.heap.length;
    }

    /**
     * 判断队列是否为空
     */
    isEmpty(): boolean {
        return this.size === 0;
    }
    top(){
        return this.peek();
    }
    /**
     * 查看队首元素
     */
    peek(): T | null {
        return this.isEmpty() ? null : this.heap[0];
    }

    /**
     * 入队
     * @param value 要添加的元素
     */
    enqueue(value: T): void {
        this.heap.push(value);
        this.siftUp(this.size - 1);
    }
    push(value: T): void {
        this.enqueue(value);
    }

    pop(){
        return this.dequeue();
    }
    /**
     * 出队
     * @returns 队首元素或null（空队列时）
     */
    dequeue(): T | null {
        if (this.isEmpty()) return null;
        const removedValue = this.heap[0];
        const last = this.heap.pop()!;
        if (!this.isEmpty()) {
            this.heap[0] = last;
            this.siftDown(0);
        }
        return removedValue;
    }

    // 上浮操作
    private siftUp(index: number): void {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.compare(this.heap[index], this.heap[parentIndex]) >= 0) break;
            this.swap(index, parentIndex);
            index = parentIndex;
        }
    }

    // 下沉操作
    private siftDown(index: number): void {
        const size = this.size;
        while (index < size) {
            const left = 2 * index + 1;
            const right = 2 * index + 2;
            let minIndex = index;
            
            if (left < size && this.compare(this.heap[left], this.heap[minIndex]) < 0) {
                minIndex = left;
            }
            if (right < size && this.compare(this.heap[right], this.heap[minIndex]) < 0) {
                minIndex = right;
            }
            if (minIndex === index) break;
            this.swap(index, minIndex);
            index = minIndex;
        }
    }

    // 交换元素
    private swap(i: number, j: number): void {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }

    /**
     * 清空队列
     */
    clear(): void {
        this.heap = [];
    }
}

// // 使用示例：
// // 最小优先队列
// const minQueue = new PriorityQueue<number>((a, b) => a - b);
// minQueue.enqueue(3);
// minQueue.enqueue(1);
// minQueue.enqueue(2);
// console.log(minQueue.dequeue()); // 1
// console.log(minQueue.dequeue()); // 2

// // 最大优先队列
// const maxQueue = new PriorityQueue<number>((a, b) => b - a);
// maxQueue.enqueue(3);
// maxQueue.enqueue(1);
// maxQueue.enqueue(2);
// console.log(maxQueue.dequeue()); // 3
// console.log(maxQueue.dequeue()); // 2

// // 自定义对象比较
// interface Task {
//     priority: number;
//     name: string;
// }
// const taskQueue = new PriorityQueue<Task>((a, b) => a.priority - b.priority);
// taskQueue.enqueue({ priority: 3, name: "Low" });
// taskQueue.enqueue({ priority: 1, name: "High" });
// console.log(taskQueue.dequeue()); // { priority: 1, name: "High" }