
async function init() {
    // Check for WebGPU support
    if (!navigator.gpu) {
        console.log('WebGPU is not supported!');
        return;
    }

    const gpu = navigator.gpu;
    const adapter = await gpu.requestAdapter();
    const device = await adapter.requestDevice();

    // Shader code
    const shaderCode = `
            [[block]] struct Data {
                values: array<f32, 4>;
            };
            
            [[binding(0), group(0)]] var<storage_buffer> src1: Data;
            [[binding(1), group(0)]] var<storage_buffer> src2: Data;
            [[binding(2), group(0)]] var<storage_buffer> dst: Data;

            [[stage(compute), workgroup_size(1)]] 
            fn main([[builtin(global_invocation_id)]] GlobalId: vec3<u32>) -> void {
                let index: u32 = GlobalId.x;
                dst.values[index] = src1.values[index] + src2.values[index];
            }
        `;

    // Create shader module
    const shaderModule = device.createShaderModule({
        code: shaderCode
    });

    // Create a buffer for input and output
    const bufferSize = 4 * 4; // 4 floats, 4 bytes each
    const src1Buffer = device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    const src2Buffer = device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    const dstBuffer = device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });

    // Write some data to the input buffers
    const writeArray = new Float32Array([1.0, 2.0, 3.0, 4.0]);
    device.queue.writeBuffer(src1Buffer, 0, writeArray.buffer);
    device.queue.writeBuffer(src2Buffer, 0, writeArray.buffer);

    // Create pipeline
    const pipeline = device.createComputePipeline({
        compute: {
            module: shaderModule,
            entryPoint: 'main'
        }
    });

    // Bind groups
    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: src1Buffer } },
            { binding: 1, resource: { buffer: src2Buffer } },
            { binding: 2, resource: { buffer: dstBuffer } }
        ]
    });

    // Dispatch
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatch(4);
    passEncoder.endPass();

    device.queue.submit([commandEncoder.finish()]);

    // Read back from the output buffer
    const readArray = new Float32Array(4);
    await dstBuffer.mapAsync(GPUMapMode.READ);
    new Float32Array(dstBuffer.getMappedRange()).set(readArray);
    dstBuffer.unmap();

    console.log(readArray); // Should print [2, 4, 6, 8]
}

window.onload = init;
