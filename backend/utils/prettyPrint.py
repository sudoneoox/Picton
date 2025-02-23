from colorama import Fore, Back, Style, init  # pretty print colors


# For Windows
init(autoreset=True)


def pretty_print(console_text: str, text_type: str = "DEBUG") -> None:
    """
    Pretty prints colors to the terminal to add more indication of what type of message is being printed

    Args:
        console_text (str): text to be outputted to the console
        text_type (str): type of text thats being outputted types are DEBUG | ERROR | INFO | WARNING

    Example:
        >>> pretty_print('this is an info message', 'INFO')
    """
    fg, bg, style = (None, None, None)

    # choosing appropriate colors
    if text_type.upper() == "DEBUG":
        fg, bg, style = Fore.CYAN, None, Style.DIM
    elif text_type.upper() == "INFO":
        fg, bg, style = Fore.GREEN, None, Style.NORMAL
    elif text_type.upper() == "ERROR":
        fg, bg, style = Fore.RED, Back.BLACK, Style.BRIGHT
    elif text_type.upper() == "WARNING":
        fg, bg, style = Fore.YELLOW, None, Style.BRIGHT
    else:
        fg, bg, style = Fore.GREEN, None, Style.NORMAL
        print(
            f"{fg}[INFO]: passed param text_type: {text_type} is not a valid text type using default text_type: INFO{Style.RESET_ALL}"
        )

    # printing actual message
    # Style.RESET_ALL is used to revert pack to default terminal fg,bg,style
    print(
        f"{fg}{bg if bg is not None else ''}{style}[{text_type}] {console_text}{Style.RESET_ALL}"
    )
