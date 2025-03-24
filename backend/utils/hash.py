def signature_upload_path(instance, filename):
    # get file extension
    ext = filename.split(".")[-1]
    # create deterministic filename using userID
    return f"signatures/user_{instance.id}_signature.{ext}"
