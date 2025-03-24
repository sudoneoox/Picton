import inspect


class MethodNameMixin:
    def _get_method_name(self) -> str | None:
        """Returns name of th calling method and its class."""
        return (
            f"{self.__class__.__name__}.{inspect.currentframe().f_back.f_code.co_name}"
        )
