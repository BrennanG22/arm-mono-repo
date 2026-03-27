import logging
import re

REGEX_PATTERN = r'\(|\)|\&|\||!|[a-zA-Z]+:[a-zA-Z]+'

precedence = {
    '!': 3,
    '&': 2,
    '|': 1
}

associativity = {
    '!': 'right',
    '&': 'left',
    '|': 'left'
}


def evaluate_expression(expr: str, classified_item):
    is_valid, error = _validate_expression(expr)
    if not is_valid:
        logging.getLogger().error(f"Invalid expression '{expr}': {error}")
        return False

    tokens = _tokenize(expr)
    postfix = _to_postfix(tokens)
    return _eval_postfix(postfix, classified_item)


def _validate_expression(expr: str) -> tuple[bool, str]:
    tokens = _tokenize(expr)

    if not tokens:
        return False, "Expression is empty or contains no valid tokens"

    # Check for unmatched parentheses
    depth = 0
    for token in tokens:
        if token == '(':
            depth += 1
        elif token == ')':
            depth -= 1
        if depth < 0:
            return False, "Unmatched closing parenthesis"
    if depth != 0:
        return False, "Unmatched opening parenthesis"

    # Validate token sequence using a simple state machine
    # States: expect_operand (True) or expect_operator (False)
    expect_operand = True

    for token in tokens:
        if token == '(':
            if not expect_operand:
                return False, f"Unexpected '(' — expected an operator"
            # Still expecting an operand after '('
        elif token == ')':
            if expect_operand:
                return False, f"Unexpected ')' — expected an operand or '!'"
            # After ')', we now expect an operator
        elif token == '!':
            if not expect_operand:
                return False, "Unexpected '!' — expected an operator"
            # '!' is a unary prefix, still expecting an operand
        elif token in ('&', '|'):
            if expect_operand:
                return False, f"Unexpected '{token}' — expected an operand"
            expect_operand = True
        elif ':' in token:
            if not expect_operand:
                return False, f"Unexpected operand '{token}' — expected an operator"
            expect_operand = False
        else:
            return False, f"Unknown token: '{token}'"

    if expect_operand:
        return False, "Expression ends unexpectedly — missing final operand"

    return True, ""


def _tokenize(expr: str):
    return re.findall(REGEX_PATTERN, expr)


def _to_postfix(tokens):
    output = []
    stack = []

    for token in tokens:
        if ':' in token:
            output.append(token)

        elif token in precedence:
            while (stack and stack[-1] in precedence and
                   (
                           (associativity[token] == 'left' and
                            precedence[stack[-1]] >= precedence[token]) or
                           (associativity[token] == 'right' and
                            precedence[stack[-1]] > precedence[token])
                   )):
                output.append(stack.pop())

            stack.append(token)

        elif token == '(':
            stack.append(token)

        elif token == ')':
            while stack[-1] != '(':
                output.append(stack.pop())
            stack.pop()
    while stack:
        output.append(stack.pop())
    return output


def _eval_condition(cond, item):
    key, value = cond.split(':')

    if not hasattr(item, key):
        raise Exception(f"Property '{key}' does not exist in the classification")

    item_value = getattr(item, key)

    if isinstance(item_value, bool):
        value = value.lower() == "true"
    elif isinstance(item_value, int):
        value = int(value)

    return item_value == value


def _eval_postfix(postfix, item):
    stack = []
    try:
        for token in postfix:
            if ':' in token:
                stack.append(_eval_condition(token, item))

            elif token == '!':
                a = stack.pop()
                stack.append(not a)

            elif token == '&':
                b = stack.pop()
                a = stack.pop()
                stack.append(a and b)

            elif token == '|':
                b = stack.pop()
                a = stack.pop()
                stack.append(a or b)

        return stack[0]
    except Exception as e:
        logging.getLogger().error(str(e))
        return False
