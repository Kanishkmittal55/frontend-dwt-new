# Backend Document Processing Debug Guide

## 🔴 Problem Summary

**Document processing is NOT working:**
- Frontend calls `/documents/{id}/process` → API returns 200 OK
- Backend logs "Starting to process document" 
- **Then nothing happens** - status never changes from "uploaded"
- No chunks are created
- No errors logged

## 🔍 Root Cause

The backend endpoint **accepts the request** but **doesn't actually process the document**.

This is a **BACKEND ISSUE** that needs to be fixed on the backend side.

---

## ✅ What to Check in Backend Code

### 1. Check the Process Document Endpoint

Find this file: `whyhow_api/routers/documents.py` (around line 248)

Look for the `process_document` function and check:

```python
@router.post("/documents/{document_id}/process")
async def process_document(document_id: str, config: Optional[ProcessDocumentConfig] = None):
    logger.info(f"Starting to process document")
    logger.info(f"Document has status: {document.status}")
    
    # ❓ WHAT HAPPENS HERE?
    # 
    # ✅ CORRECT: Should trigger async processing
    #    - background_tasks.add_task(process_doc_async, document_id, config)
    #    - task_queue.enqueue("process_document", document_id, config)
    #    - await trigger_processing_worker(document_id, config)
    #
    # ❌ WRONG: Just returns success without doing anything
    #    return {"status": "success"}
```

### 2. Check If Background Worker Exists

Most document processing uses a **background task queue** because:
- Chunking large documents takes time (5-60+ seconds)
- Can't block the API request
- Need retry logic if it fails

**Common task queues:**
- Celery (most common for Python)
- RQ (Redis Queue)
- Dramatiq
- Background Tasks (FastAPI)

**Check if worker is running:**

```bash
# If using Celery
ps aux | grep celery
celery -A your_app worker --loglevel=info

# If using RQ
ps aux | grep rq
rq worker

# Check systemd services
systemctl status celery-worker
systemctl status document-processor-worker
```

### 3. Check Processing Logic

Find the actual processing function (usually in `services/` or `tasks/`):

```python
# Example: whyhow_api/services/document_processor.py or tasks/process_document.py

def process_document_task(document_id: str, config: ProcessDocumentConfig):
    """This is what ACTUALLY does the work"""
    try:
        # 1. Fetch document from DB
        doc = get_document(document_id)
        
        # 2. Update status to 'processing'
        update_document_status(document_id, "processing")
        
        # 3. Download file from S3/MinIO
        file_content = download_from_storage(doc.storage_path)
        
        # 4. Chunk the document
        chunks = split_into_chunks(file_content, config.chunk_size, config.chunk_overlap)
        
        # 5. Create embeddings (if needed)
        embedded_chunks = create_embeddings(chunks)
        
        # 6. Store chunks in database
        save_chunks_to_db(document_id, embedded_chunks)
        
        # 7. Update status to 'processed'
        update_document_status(document_id, "processed")
        
        logger.info(f"✅ Successfully processed document {document_id}: {len(chunks)} chunks created")
        
    except Exception as e:
        logger.error(f"❌ Processing failed for {document_id}: {str(e)}", exc_info=True)
        update_document_status(document_id, "failed")
        raise
```

### 4. Add Comprehensive Logging

Add logs at every step:

```python
@router.post("/documents/{document_id}/process")
async def process_document(document_id: str, config: Optional[ProcessDocumentConfig] = None):
    logger.info(f"🔵 [ENDPOINT] Process request received for document: {document_id}")
    logger.info(f"🔵 [ENDPOINT] Config: {config}")
    
    document = await get_document_from_db(document_id)
    logger.info(f"🔵 [ENDPOINT] Current document status: {document.status}")
    
    # Trigger background processing
    try:
        logger.info(f"🔵 [ENDPOINT] Enqueuing processing task...")
        task_id = background_queue.enqueue(process_document_task, document_id, config)
        logger.info(f"✅ [ENDPOINT] Task enqueued with ID: {task_id}")
    except Exception as e:
        logger.error(f"❌ [ENDPOINT] Failed to enqueue task: {str(e)}", exc_info=True)
        raise
    
    return {"status": "success", "task_id": task_id}


# In the worker task
@celery_app.task
def process_document_task(document_id: str, config: dict):
    logger.info(f"🟢 [WORKER] Starting processing for document: {document_id}")
    logger.info(f"🟢 [WORKER] Worker PID: {os.getpid()}")
    
    try:
        # Step 1
        logger.info(f"🟢 [WORKER] Step 1: Updating status to 'processing'")
        update_status(document_id, "processing")
        
        # Step 2
        logger.info(f"🟢 [WORKER] Step 2: Downloading file from storage")
        file_content = download_file(document_id)
        logger.info(f"🟢 [WORKER] Downloaded {len(file_content)} bytes")
        
        # Step 3
        logger.info(f"🟢 [WORKER] Step 3: Chunking document")
        chunks = chunk_text(file_content, config)
        logger.info(f"🟢 [WORKER] Created {len(chunks)} chunks")
        
        # Step 4
        logger.info(f"🟢 [WORKER] Step 4: Saving chunks to database")
        save_chunks(document_id, chunks)
        
        # Step 5
        logger.info(f"🟢 [WORKER] Step 5: Updating status to 'processed'")
        update_status(document_id, "processed")
        
        logger.info(f"✅ [WORKER] Processing completed successfully")
        
    except Exception as e:
        logger.error(f"❌ [WORKER] Processing failed: {str(e)}", exc_info=True)
        update_status(document_id, "failed")
        raise
```

### 5. Check Environment Variables

Make sure these are configured:

```bash
# Task queue connection
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Or if using RQ
REDIS_URL=redis://localhost:6379

# Object storage (MinIO/S3)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=knowledge-graph-docs

# Database
MONGODB_URI=mongodb://localhost:27017/whyhow
```

### 6. Check Dependencies

Make sure all required services are running:

```bash
# Redis (for task queue)
redis-cli ping
# Should return: PONG

# MongoDB
mongosh --eval "db.runCommand({ ping: 1 })"
# Should show: ok: 1

# MinIO
curl http://localhost:9000/minio/health/live
# Should return: 200 OK

# Backend API
curl http://localhost:8000/health
# Should return: 200 OK

# Worker (if using Celery)
celery -A whyhow_api.celery inspect ping
# Should show: pong from worker
```

---

## 🧪 Manual Testing

### Test 1: Direct Function Call

```python
# In backend Python shell/REPL
from whyhow_api.services.document_processor import process_document_task

# Try processing directly
result = process_document_task("68fdec535d29a0a92a862d15", {"chunk_size": 1000})
print(result)
# Watch for errors
```

### Test 2: Check Task Queue

```python
# If using Celery
from whyhow_api.celery import app
inspector = app.control.inspect()

# Check active tasks
print(inspector.active())

# Check registered tasks
print(inspector.registered())

# Check stats
print(inspector.stats())
```

### Test 3: Monitor Worker Logs

```bash
# Start worker with verbose logging
celery -A whyhow_api.celery worker --loglevel=debug

# In another terminal, trigger processing from frontend
# Watch worker logs for task execution
```

---

## 🔧 Common Issues & Fixes

### Issue 1: Worker Not Running

**Symptom:** Tasks enqueued but never execute

**Fix:**
```bash
# Start the worker
celery -A whyhow_api.celery worker --loglevel=info

# Or use systemd
systemctl start celery-worker
```

### Issue 2: Redis Not Connected

**Symptom:** Error: "Error 111 connecting to localhost:6379"

**Fix:**
```bash
# Start Redis
redis-server
# Or
systemctl start redis
```

### Issue 3: MinIO File Not Found

**Symptom:** Processing starts but fails to download file

**Fix:**
- Check MinIO is running: `docker ps | grep minio`
- Check file exists: Use MinIO web UI at http://localhost:9000
- Check credentials in environment variables

### Issue 4: Silent Failures

**Symptom:** No errors logged, just stops

**Fix:**
- Add try-catch blocks around every step
- Log to both console AND file
- Check worker stderr: `celery worker 2>&1 | tee worker.log`

### Issue 5: Task Timeout

**Symptom:** Large documents fail silently

**Fix:**
```python
# Increase task timeout in Celery config
app.conf.task_time_limit = 300  # 5 minutes
app.conf.task_soft_time_limit = 280  # Soft limit at 4m40s
```

---

## 📊 Expected Behavior

### Correct Flow

1. **Frontend** calls `POST /documents/{id}/process`
2. **Backend endpoint** enqueues task → returns immediately
3. **Worker** picks up task from queue
4. **Worker** updates status: `uploaded` → `processing`
5. **Worker** downloads file from MinIO
6. **Worker** chunks document
7. **Worker** saves chunks to MongoDB
8. **Worker** updates status: `processing` → `processed`
9. **Frontend** polls and sees status change → shows chunks

### Current Broken Flow

1. ✅ **Frontend** calls `POST /documents/{id}/process`
2. ✅ **Backend endpoint** returns 200 OK
3. ❌ **Worker** never executes (or fails silently)
4. ❌ Status stays `uploaded` forever
5. ❌ No chunks created

---

## 📝 Next Steps

1. **Check backend logs** with verbose logging enabled
2. **Verify worker is running** and processing tasks
3. **Add comprehensive logging** at every step
4. **Test processing function directly** in Python shell
5. **Monitor task queue** to see if tasks are being created/consumed

---

## 🆘 If You're Stuck

### Quick Diagnostic Commands

```bash
# 1. Check all services
docker-compose ps

# 2. Check backend logs
docker-compose logs -f api

# 3. Check worker logs (if containerized)
docker-compose logs -f worker

# 4. Check Redis queue
redis-cli
> LLEN celery  # Should show pending tasks
> KEYS *       # Show all keys

# 5. Check MongoDB documents
mongosh
> use whyhow
> db.documents.find({_id: ObjectId("68fdec535d29a0a92a862d15")})
```

### Contact Points

- Backend logs: Look for "Starting to process document"
- Worker logs: Should show task execution
- Redis: Should show tasks being queued
- MongoDB: Status should change from "uploaded" to "processing" to "processed"

**The gap between "Starting to process document" and nothing happening is where the bug lives.**

